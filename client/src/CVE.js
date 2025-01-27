import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import './CVE.css'
import axios from 'axios';

const CVE = () => {
    const { id } = useParams();
    const [cve, setCVE] = useState({});

    useEffect(() => {
        const getData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/cves/${id}`);
                setCVE(response.data);
                console.log(response.data);
            } catch (error) {
                alert(error);
                console.log('Error: ', error);
            }
        }
        getData();
    }, [id]);

    return (
        <div className='cve-sep'>
            <h1>{cve.id}</h1>
            <h3>Description: </h3>
            <p>In Solaris 2.2 and 2.3, when fsck fails on startup, it allows a local user with physical access to obtain root access.</p>
            <h3>CVSS V2 Metrices:</h3>
            <p><span>Severity</span> : {cve.metrics && cve.metrics[0]?.baseSeverity} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span>Score:</span> <span className='red'>{cve.metrics && cve.metrics[0]?.cvssData?.baseScore}</span></p>
            <p className="vector-string"><span>Vector String:</span> {cve.metrics && cve.metrics[0]?.cvssData?.vectorString}</p>

            <table className="metrics-table">
                <thead>
                    <tr>
                        <th>Access Vector</th>
                        <th>Access Complexity</th>
                        <th>Authentication</th>
                        <th>Confidentiality Impact</th>
                        <th>Integrity Impact</th>
                        <th>Availability Impact</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{cve.metrics && cve.metrics[0]?.cvssData?.accessVector}</td>
                        <td>{cve.metrics && cve.metrics[0]?.cvssData?.accessComplexity}</td>
                        <td>{cve.metrics && cve.metrics[0]?.cvssData?.authentication}</td>
                        <td>{cve.metrics && cve.metrics[0]?.cvssData?.confidentialityImpact}</td>
                        <td>{cve.metrics && cve.metrics[0]?.cvssData?.integrityImpact}</td>
                        <td>{cve.metrics && cve.metrics[0]?.cvssData?.availabilityImpact}</td>
                    </tr>
                </tbody>
            </table>

            <h3>Scores:</h3>
            <div className="scores-section">
                <p><span>Exploitability Score: {cve.metrics && cve.metrics[0]?.exploitabilityScore}</span></p>
                <p><span>Impact Score: {cve.metrics && cve.metrics[0]?.impactScore}</span></p>
            </div>

            <h3>CPE:</h3>
            {cve.configurations && (
                <table className="cpe-table">
                    <thead>
                        <tr>
                            <th>Criteria</th>
                            <th>Match Criteria ID</th>
                            <th>Vulnerable</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cve.configurations.map((config, configIndex) =>
                            config.nodes.map((node, nodeIndex) =>
                                node.cpeMatch.map((cpe, cpeIndex) => (
                                    <tr>
                                        <td>{cpe.criteria}</td>
                                        <td>{cpe.matchCriteriaId}</td>
                                        <td>{cpe.vulnerable ? 'Yes' : 'No'}</td>
                                    </tr>
                                ))
                            )
                        )}
                    </tbody>
                </table>
            )}
        </div>
    )
}

export default CVE