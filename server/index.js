import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import CVE from './models/CVE.js';
import mongoose from 'mongoose';
import Progress from './models/Progress.js';
import cron from 'node-cron';

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true, limit: "30mb" }));
dotenv.config();

const fetchAndStoreCVE = async (incremental = false) => {
    console.log('Starting CVE data fetch process...');
    const progress = await Progress.findOne({ task: 'cve_fetch' });
    let startIndex = incremental && progress ? progress.lastIndex : 0;
    let lastModifiedDate = progress?.lastModified || '2000-01-01T00:00:00Z';

    try {
        do {
            console.log(`Fetching data from NVD API with startIndex: ${startIndex}`);
            const apiUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=2000&startIndex=${startIndex}${
                incremental ? `&lastModified=${lastModifiedDate}` : ''
            }`;
            const response = await axios.get(apiUrl);

            if (response.status !== 200) {
                console.error(`Unexpected response status: ${response.status}`);
                break;
            }

            const vulnerabilities = response.data.vulnerabilities;

            if (!vulnerabilities || vulnerabilities.length === 0) {
                console.log('No vulnerabilities found in the current batch. Exiting.');
                break;
            }

            console.log(`Fetched ${vulnerabilities.length} vulnerabilities. Processing...`);

            // Filter out existing vulnerabilities
            const ids = vulnerabilities.map(v => v.cve.id);
            const existingIds = new Set(
                (await CVE.find({ id: { $in: ids } }, { id: 1 })).map(doc => doc.id)
            );

            const newVulnerabilities = vulnerabilities
                .filter(v => !existingIds.has(v.cve.id))
                .map(v => ({
                    id: v.cve.id,
                    published: v.cve.published,
                    lastModified: v.cve.lastModified,
                    vulnStatus: v.cve.vulnStatus,
                    metrics: v.cve.metrics?.cvssMetricV2 || [],
                    configurations: v.cve.configurations,
                }));

            if (newVulnerabilities.length > 0) {
                await CVE.insertMany(newVulnerabilities, { ordered: false });
                console.log(`Inserted ${newVulnerabilities.length} new vulnerabilities into the database.`);
            } else {
                console.log('No new vulnerabilities to insert.');
            }

            startIndex += 2000;

            await Progress.updateOne(
                { task: 'cve_fetch' },
                {
                    $set: {
                        lastIndex: startIndex,
                        lastModified: vulnerabilities[vulnerabilities.length - 1]?.cve.lastModified || lastModifiedDate,
                    },
                },
                { upsert: true }
            );

            if (startIndex >= response.data.totalResults) {
                console.log('Reached the end of available data. Fetching process completed.');
                break;
            }

        } while (true);
    } catch (error) {
        if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
            console.warn('Connection reset. Retrying in 5 seconds...');
            await new Promise(res => setTimeout(res, 5000)); // Retry delay
            return fetchAndStoreCVE(incremental); // Retry the function
        } else {
            console.error('An error occurred during the CVE fetch process:', error);
        }
    }
};


cron.schedule('0 */6 * * *', async () => {
    console.log('Running periodic CVE synchronization...');
    await fetchAndStoreCVE(true); 
});

app.get('/api/cves', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalRecords = await CVE.countDocuments();

        const cves = await CVE.find()
            .skip(skip)
            .limit(limit)
            .select('id identifier published lastModified metrics vulnStatus');

        res.json({ cves, totalRecords, currentPage: page, totalPages: Math.ceil(totalRecords / limit) });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching CVEs', error });
    }
});

app.get('/api/cves/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cve = await CVE.findOne({ id });
        if (!cve)
            return res.status(404).json({ error: 'CVE not found' });
        res.json(cve);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/cves/year/:year', async (req, res) => {
    try {
        const { year } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const cves = await CVE.find({
            published: { $regex: new RegExp(`^${year}-`), $options: 'i' }
        })
        .skip((page - 1) * limit)
        .limit(limit);

        const totalRecords = await CVE.countDocuments({ published: { $regex: new RegExp(`^${year}-`), $options: 'i' } });

        res.status(200).json({ totalRecords, cves });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.get('/api/cves/score/:score', async (req, res) => {
    try {
        const { score } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const cves = await CVE.find({ "metrics.cvssData.baseScore": { $gte: parseFloat(score) } })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalRecords = await CVE.countDocuments({ "metrics.cvssData.baseScore": { $gte: parseFloat(score) } });

        res.status(200).json({ totalRecords, cves, score: parseFloat(score) });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});



app.get('/api/cves/modified/:days', async (req, res) => {
    try {
        const { days } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - parseInt(days));
        const dateLimit = currentDate.toISOString().slice(0, -1);

        const cves = await CVE.find({ "lastModified": { $gte: String(dateLimit) } })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalRecords = await CVE.countDocuments({ "lastModified": { $gte: String(dateLimit) } });

        res.status(200).json({ totalRecords, cves, dateLimit });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});



//calling only once
//fetchAndStoreCVE();

const PORT = process.env.PORT;
mongoose.connect(process.env.MONGO_URL)
    .then(async () => {
        console.log('Connected to MongoDB. Cleaning up unused fields...');
        await CVE.updateMany({}, { $unset: { descriptions: 1, references: 1 } });
        console.log('Database cleanup completed.');

        app.listen(PORT, () => {
            console.log(`Server running on Port: ${PORT}`);
        });
    })
    .catch((error) => {
        console.log('Error: ', error);
    });

