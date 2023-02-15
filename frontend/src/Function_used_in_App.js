import React from "react";
import logo from './react_yellow.svg';


export function ConnectWallet({connectWallet, network_error, dismiss}){
    return (
      <div>
      <div className="container">
        <div className="row justify-content-md-center">
          <div className="col-12 text-center">
            {/* Metamask network should be set to Localhost:8545. */}
            {network_error && (
              <NetworkErrorMex
                message={network_error} 
                dismiss={dismiss} 
              />
            )}
          </div>
          <div className="col-6 p-4 text-center">
            <p>Please connect to your wallet.</p>
            <button
              className="btn btn-warning"
              type="button"
              onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
      <div className="App">
        <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        </header>
      </div>
      </div>
    );
  }
  
  
export function NoWalletDetected(){
    return(
      <div className = "container">
        <div className = "row justify-content-md-center">
          <div className = "col-6 p-4 text-center">
            <p>
              No Ethereum wallet has been detected. <br />
              Please install{" "}
              <a href="http://metamask.io"
                 target="_blank" // we display the linked url in a new tab
                 rel="noopener noreferrer"> 
                Metamask 
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }
  
function NetworkErrorMex({message, dismiss}){
    return(
      <div className='alert alert-danger' role='alert'>
        {message}
        <button type="button"
          className="close"
          data-dismiss="alert"
          aria-label="Close"
          onClick={dismiss}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
  
    );
  }
