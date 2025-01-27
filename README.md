# CVE Management API

This repository contains both backend and frontend implementations for a CVE Management System. The API serves as the backend solution, providing endpoints to filter and retrieve CVE details based on various criteria like CVE ID, year, CVE score, and last modified date. The frontend built with React provides a user interface to interact with these API endpoints.

---
## Project Live Link

You can visit my website at [securin-frontend.vercel.app](https://securin-frontend.vercel.app/cves/list).

## Tech Stack Used

### Backend
- **Node.js**: For server-side logic and API development.
- **Express.js**: A lightweight web framework for Node.js.
- **MongoDB**: NoSQL database for storing CVE data.

### Frontend
- **React.js**: For building the frontend user interface.
- **Axios**: For making API requests.
- **CSS**: For styling of website.

---

## Problem Statement

This API aims to handle CVE data efficiently by providing filtering options based on the following criteria:

1. **CVE ID**: Retrieve CVEs by their unique ID.
2. **CVE Year**: Filter CVEs that belong to a specific year.
3. **CVE Score**: Filter CVEs by their CVSS base score.
4. **Last Modified in N Days**: Retrieve CVEs that have been modified within the last N days.

---

## Approach

### Backend
1. **Database Schema Design**:
   - Created a `CVE` schema with fields like `id`, `published`, `lastModified`, `metrics`, etc.
   - Used Mongoose to model and interact with the schema.

2. **APIs**:
   - **/api/cves/:id**: Retrieve a CVE by its ID.
   - **/api/cves/year/:year**: Retrieve CVEs published in a specific year.
   - **/api/cves/score/:score**: Filter CVEs with a CVSS base score greater than or equal to the provided score.
   - **/api/cves/modified/:days**: Retrieve CVEs modified within the last N days.

3. **Query Filtering**:
   - Implemented MongoDB queries to filter based on regex for year, and numerical comparisons for CVSS score and last modified dates.
   - Ensured results are returned as expected based on user-defined filters.

### Frontend
1. **React Components**:
   - **Home Component**: Displays form elements for input like CVE ID, Year, Score, and Days since last modified.
   - **Table Component**: Displays CVE data in a table format.
   - **Pagination and Sorting**: Handles pagination for large datasets.
   
2. **API Calls**:
   - Used Axios to fetch data from the backend API.
   - Handles form inputs, sends requests, and displays results dynamically.

---

## Code Example

### Backend API for CVE Score Filter
```javascript
app.get('/api/cves/score/:score', async (req, res) => {
    try {
        const { score } = req.params;
        const cves = await CVE.find({ 
            "metrics[0].cvssData.baseScore": { $gte: parseFloat(score) } 
        });
        res.status(200).json({ cves, score: parseFloat(score) });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
```
--- 
## 📊 Output Examples

### 1. Backend CVE Score Filter Output
```json
{
  "cves": [
    {
      "_id": "676057f632802a111a00978e",
      "id": "CVE-1999-0095",
      "published": "1988-10-01T04:00:00.000Z",
      "lastModified": "2024-11-20T23:27:50.607Z",
      "vulnStatus": "Modified",
      "metrics": [
        {
          "source": "nvd@nist.gov",
          "type": "Primary",
          "cvssData": {
            "version": "2.0",
            "baseScore": 10
          },
          "baseSeverity": "HIGH"
        }
      ]
    }
  ],
  "score": 7
}
```
### 2. Frontend CVE Year Filter Output
```json
{
  "cves": [
    {
      "_id": "676057f632802a111a00978e",
      "id": "CVE-1999-0095",
      "published": "1988-10-01T04:00:00.000Z",
      "lastModified": "2024-11-20T23:27:50.607Z",
      "vulnStatus": "Modified",
      "metrics": [
        {
          "source": "nvd@nist.gov",
          "type": "Primary",
          "cvssData": {
            "version": "2.0",
            "baseScore": 10
          },
          "baseSeverity": "HIGH"
        }
      ]
    }
  ]
}
