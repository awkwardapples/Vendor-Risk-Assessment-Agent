// react frontend

import React, {useEffect, useState} from "react"; // react library imported
// useEffect runs code after a component renders (like when we laod vendors
// useState manages component when data changes over time)
import ReactDOM from "react-dom/client";  // reactDOM renders react components to DOM (DOM is api for accessing HTML documents)

function Main() {
    const [vendors, setVendors] = useState([]); 
    // vendors is empty array, setVendors is function to update thois state
    const [chosen, setChosen] = useState(null);    
    // chosen tracks vendor chosen (starts as null)
    const [result, setResult] = useState(null);  
    // stores result of agent assessment (starts as null)  

    useEffect(() => {  
        const backendUrl = import.meta.env.VITE_BACKEND_URL
        fetch(`${backendUrl}/vendors`) // fetches vendor list from backend server GET route by accessing /vendors
            .then(res => res.json()) // res converted to json
            .then(setVendors); // vendors state updated to be = to vendors list we recieved
            // this vendor data population happens after first render
    }, []);

    // formatting the raw json vendor data for clean display in ui
    function formatVendorData(vendor) {
        if (!vendor) return '';
        
        const formatKey = (key) => { // keys cleanup
            return key.replace(/_/g, ' ') // get rid of underscores
                     .split(' ') 
                     .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // first letter to uppercase
                     .join(' '); 
        };
        
        const formatValue = (value) => { // value cleanup
            if (Array.isArray(value)) return value.join(', '); // take all values from array and return them with comma separation
            if (typeof value === 'boolean') return value ? 'Yes' : 'No'; // make yes / noe instead of true / false
            return String(value); // return the new value
        };

        return Object.entries(vendor) // return formatted json vendor data using functions above
            .map(([key, value]) => `${formatKey(key)}: ${formatValue(value)}`)
            .join('\n');
    }

    async function assess(){ // function for trigeering the risk assessment called when button clicked in UI
        const backendUrl = import.meta.env.VITE_BACKEND_URL
        const res = await fetch(`${backendUrl}/assess`, { // sends vendor ID and response is equal to result returned from backend server VendorAssessment function
            method:"POST", // post for sending data
            headers: { "Content-Type": "application/json"}, // tells server expecting json data
            body: JSON.stringify({vendorID: chosen.id}) // bodyu contains vendorID to be assessed (as json string)
        });
        setResult(await res.json()); // result is updated by waiting for backend response and converting it to json
        // main component rerenders to show results now 
    }

    return ( // main function returns the jsx below which is html like syntax which react renders in the webpage
        <div style={{ 
            padding: '30px', 
            fontFamily: 'Arial, sans-serif',
            maxWidth: '800px',
            margin: '0 auto'
        }}>
        <h1 style={{ color: '#1a73e8', textAlign: 'center' }}>AI Vendor Risk Assessment Agent</h1> 

        <select 
            onChange={e => { 
                const v = vendors.find(v => v.id === e.target.value); 
                setChosen(v);
                setResult(null);
            }}
            value={chosen?.id || ''}
            style={{
                padding: '10px',
                fontSize: '16px',
                marginBottom: '20px',
                width: '100%',
                border: '2px solid #ddd',
                borderRadius: '4px'
            }}
        >
            <option value="">Select vendor</option>
            {vendors.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
            ))}
        </select> 

        {chosen && ( 
            <>
            <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                marginBottom: '15px',
                whiteSpace: 'pre-line',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.6'
            }}>
                {formatVendorData(chosen)}
            </div>
            <button 
                onClick={assess}
                style={{
                    padding: '12px 24px',
                    backgroundColor: '#1a73e8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                }}
            >
                Assess Risk
            </button>
            </>
        )}

        {result && ( 
            <div style={{ 
                marginTop: '30px',
                padding: '20px', 
                backgroundColor: '#e8f5e9', 
                borderRadius: '8px',
                border: '1px solid #c8e6c9'
            }}>
                <h2 style={{ color: '#2e7d32', marginTop: 0 }}>Assessment Result</h2>
                <p><strong>Risk:</strong> <span style={{ 
                    color: result.risk_level === 'HIGH' ? '#d32f2f' : 
                           result.risk_level === 'MEDIUM' ? '#f57c00' : '#388e3c' 
                }}>{result.risk_level}</span></p>
                <p><strong>Recommendation:</strong> {result.recommendation}</p>
                <p><strong>Confidence:</strong> {result.confidence_score}%</p>
                <p><strong>Explanation:</strong> {result.explanation}</p>
                <small style={{ color: '#666' }}>Assessed at: {new Date(result.timestamp).toLocaleString()}</small>
            </div>
        )}
        </div>
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Main />); // finds html element with ID "root" from index.html
// then react can use the UI