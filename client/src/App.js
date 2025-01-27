import React from 'react'
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CVEList from './CVEList';
import CVE from './CVE';
const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
           <Route path = "/cves/list" element = {<CVEList />} />
           <Route path = "/cves/:id" element = {<CVE />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App