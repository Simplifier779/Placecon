import React, { useEffect, useState } from 'react';
import './App.css';
import logo from './logo.jpg';

const App = () => {
  const [tableData, setTableData] = useState([]);
  const [dropdown1Value, setDropdown1Value] = useState('');
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/tasks');
        const data = await response.json();
        const sortedData = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setTableData(sortedData);
      } catch (error) {
        console.error('Error fetching table data:', error);
      }
    };
  
    fetchData();
  
    const interval = setInterval(() => {
      fetchData();
    }, 1000); // Fetch data every 1 second
  
    return () => {
      clearInterval(interval); // Clean up the interval on component unmount
    };
  }, []);

  const handleDropdown1Change = (e) => {
    setDropdown1Value(e.target.value);
  };

  const filteredData = tableData.filter((rowData) => {
    const symbol = rowData.symbol; // Get the symbol property
    if (dropdown1Value === 'ALLBANKS') {
      return symbol && symbol.startsWith("'ALLBANKS");
    } else if (dropdown1Value === 'MAINIDX') {
      return symbol && symbol.startsWith("'MAINIDX");
    } else if (dropdown1Value === 'FINANCIALS') {
      return symbol && symbol.startsWith("'FINANCIALS");
    } else if (dropdown1Value === 'MIDCAPS') {
      return symbol && symbol.startsWith("'MIDCAPS");
    }
  });

  const getCallsRowStyle = (rowData) => {
    if (rowData.symbol) {
      let ltpValue;

      if (dropdown1Value === 'ALLBANKS' && /^[A-Za-z]+$/.test(rowData.symbol)) {
        ltpValue = rowData.LTP;
      } else if (dropdown1Value === 'FINANCIALS' && /^[A-Za-z]+$/.test(rowData.symbol)) {
        ltpValue = rowData.LTP;
      } else if (dropdown1Value === 'MIDCAPS' && /^[A-Za-z]+$/.test(rowData.symbol)) {
        ltpValue = rowData.LTP;
      } else if (dropdown1Value === 'MAINIDX' && /^[A-Za-z]+$/.test(rowData.symbol)) {
        ltpValue = rowData.LTP;
      } else {
        ltpValue = rowData.LTP;
      }

      if (parseFloat(rowData.Strikeprice) > parseFloat(ltpValue)) {
        return { backgroundColor: 'green' };
      }
    }
    return null;
  };

  const getPutsRowStyle = (rowData) => {
    if (rowData.symbol && rowData.symbol.endsWith("PE'")) {
      let ltpValue;

      if (dropdown1Value === 'ALLBANKS' && /^[A-Za-z]+$/.test(rowData.symbol)) {
        ltpValue = rowData.LTP;
      } else if (dropdown1Value === 'FINANCIALS' && /^[A-Za-z]+$/.test(rowData.symbol)) {
        ltpValue = rowData.LTP;
      } else if (dropdown1Value === 'MIDCAPS' && /^[A-Za-z]+$/.test(rowData.symbol)) {
        ltpValue = rowData.LTP;
      } else if (dropdown1Value === 'MAINIDX' && /^[A-Za-z]+$/.test(rowData.symbol)) {
        ltpValue = rowData.LTP;
      } else {
        ltpValue = rowData.LTP;
      }

      if (parseFloat(rowData.Strikeprice) < parseFloat(ltpValue)) {
        return { backgroundColor: 'green' };
      }
    }
    return null;
  };

  const filteredCallsData = filteredData.filter((rowData) => rowData.symbol && rowData.symbol.endsWith("CE'"));
  const filteredPutsData = filteredData.filter((rowData) => rowData.symbol && rowData.symbol.endsWith("PE'"));

  return (
    <div className="container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>
            <img src={logo} alt="Logo" className="logo" />
            Placecon
          </h1>
        </div>
      </nav>
      <div className="dropdown-container">
        <select className="dropdown" value={dropdown1Value} onChange={handleDropdown1Change}>
          <option value="ALLBANKS">ALLBANKS</option>
          <option value="MAINIDX">NIFTY</option>
          <option value="FINANCIALS">FINANCIALS</option>
          <option value="MIDCAPS">MIDCAPS</option>
        </select>
        <div className="legend-dropdown">
          <button className="dropdown" onClick={() => setShowLegend(!showLegend)}>
            Show Legend
          </button>
          {showLegend && (
            <div className="legend-menu">
              <div className="legend-item">ExpiryDate: ED</div>
              <div className="legend-item">Strikeprice: SP</div>
              <div className="legend-item">PUT/CALL: PC</div>
              <div className="legend-item">totalTradedVolume: TTV</div>
              <div className="legend-item">bestBid: BB</div>
              <div className="legend-item">bestAsk: BA</div>
              <div className="legend-item">bestBidQty: BBQ</div>
              <div className="legend-item">bestAskQty: BAQ</div>
              <div className="legend-item">openInterest: OI</div>
              <div className="legend-item">prevClosePrice: PCP</div>
              <div className="legend-item">prevOpenInterest: POI</div>
              <div className="legend-item">ImpliedVolatility: IV</div>
            </div>
          )}
        </div>
      </div>
      <div className="tables-container">
        <div className="table-container">
          <h2>Calls Table</h2>
          <table className="table calls-table">
            <thead>
              <tr>
                <th style={{width:'60px'}}>Symbol</th>
                <th style={{width:'30px'}}>Stock</th>
                <th>ED</th>
                <th>SP</th>
                <th>PC</th>
                <th style={{width:'30px'}}>LTP</th>
                <th>LTQ</th>
                <th>TTV</th>
                <th>BB</th>
                <th>BA</th>
                <th>BBQ</th>
                <th>BAQ</th>
                <th>OI</th>
                <th style={{width:'60px'}}>timestamp</th>
                <th>sequence</th>
                <th style={{width:'30px'}}>PCP</th>
                <th style={{width:'30px'}}>POI</th>
                <th style={{width:'30px'}}>TTM</th>
                <th>Change</th>
                <th>ChangeinOI</th>
                <th style={{width:'60px'}}>IV</th>
              </tr>
            </thead>
            <tbody>
              {filteredCallsData.map((rowData, index) => (
                <tr key={index} style={getCallsRowStyle(rowData)}>
                  <td>{rowData.symbol}</td>
                  <td>{rowData.Stock}</td>
                  <td>{rowData.ExpiryDate}</td>
                  <td>{rowData.Strikeprice}</td>
                  <td>{rowData.PC}</td>
                  <td>{rowData.LTP}</td>
                  <td>{rowData.LTQ}</td>
                  <td>{rowData.totalTradedVolume}</td>
                  <td>{rowData.bestBid}</td>
                  <td>{rowData.bestAsk}</td>
                  <td>{rowData.bestBidQty}</td>
                  <td>{rowData.bestAskQty}</td>
                  <td>{rowData.openInterest}</td>
                  <td>{rowData.timestamp}</td>
                  <td>{rowData.sequence}</td>
                  <td>{rowData.prevClosePrice}</td>
                  <td>{rowData.prevOpenInterest}</td>
                  <td>{rowData.TTM}</td>
                  <td>{rowData.change}</td>
                  <td>{rowData.ChangeinOI}</td>
                  <td>{rowData.ImpliedVolatility}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-container">
          <h2>Puts Table</h2>
          <table className="table puts-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Stock</th>
                <th>ED</th>
                <th>SP</th>
                <th>PC</th>
                <th>LTP</th>
                <th>LTQ</th>
                <th>TTV</th>
                <th>BB</th>
                <th>BA</th>
                <th>BBQ</th>
                <th>BAQ</th>
                <th>OI</th>
                <th>timestamp</th>
                <th>sequence</th>
                <th>PCP</th>
                <th>POI</th>
                <th>TTM</th>
                <th>Change</th>
                <th>ChangeinOI</th>
                <th>IV</th>
              </tr>
            </thead>
            <tbody>
              {filteredPutsData.map((rowData, index) => (
                <tr key={index} style={getPutsRowStyle(rowData)}>
                  <td>{rowData.symbol}</td>
                  <td>{rowData.Stock}</td>
                  <td>{rowData.ExpiryDate}</td>
                  <td>{rowData.Strikeprice}</td>
                  <td>{rowData.PC}</td>
                  <td>{rowData.LTP}</td>
                  <td>{rowData.LTQ}</td>
                  <td>{rowData.totalTradedVolume}</td>
                  <td>{rowData.bestBid}</td>
                  <td>{rowData.bestAsk}</td>
                  <td>{rowData.bestBidQty}</td>
                  <td>{rowData.bestAskQty}</td>
                  <td>{rowData.openInterest}</td>
                  <td>{rowData.timestamp}</td>
                  <td>{rowData.sequence}</td>
                  <td>{rowData.prevClosePrice}</td>
                  <td>{rowData.prevOpenInterest}</td>
                  <td>{rowData.TTM}</td>
                  <td>{rowData.change}</td>
                  <td>{rowData.ChangeinOI}</td>
                  <td>{rowData.ImpliedVolatility}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default App;
