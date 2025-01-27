import mongoose from "mongoose";

const cveSchema = new mongoose.Schema({
    id: String,
    published: String,
    lastModified: String,
    vulnStatus: String,
    metrics: Object,
    configurations: [Object],
});

const CVE = mongoose.model('CVE', cveSchema);
export default CVE;
