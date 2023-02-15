//import logo from './logo.svg';
//import './App.css';
import React from 'react';
import Owner from './components/Owner.js';
import Distributor from './components/Distributor.js';
import Farmer from './components/Farmer.js';
import Consumer from './components/Consumer.js';
import Retailer from './components/Retailer.js';
import './App.css';
import { NoWalletDetected, ConnectWallet} from "./Function_used_in_App";

// import ABI and bytecode to interact with smart contract
import Supply_chain_artifact from "./contracts/Supply_chain.json";
import contract_address from "./contracts/contract_address.json";

const {ethers} = require('ethers');

// we hardcode the hardhat network id
const Hardhat_network_id = '31337';

/* Component'goal:
1) Use web3 inject API windows.ethereum to verify if a wallet/provider is connected
2) The user, according to what he want to do, choose an option*/

class App extends React.Component{
  constructor(props){
    super(props);
    this.initial_state = {  // user's address, contract instance and value that will define the role of the user
      contract: undefined,
      user_address: undefined,
      network_error: undefined,
      value: undefined,
      click: undefined,
    };
    this.state = this.initial_state;
    
    this._connectWallet = this._connectWallet.bind(this);
    this._dismissNetworkError = this._dismissNetworkError.bind(this);
    this.handleChange = this.handleChange.bind(this);
  };

  async _connectWallet(){ // this method or event handler is called when the user click the button defined in the class function ConnectWallet
    const [user_address] = await window.ethereum.request({method : 'eth_requestAccounts'});
    // the method used above, returns a promise that will resolve the user's address
  
    // we check the network state variable
    if(!this._checkNetwork()){
      return;
    }

    // we're ready to initalize the dapp
    this._initialize(user_address);

    // handle the event: the user removes the Dapp from the "Connected list of sites allowed to your addresses", so to avoid error we reset the state
    window.ethereum.on("accountsChanged", ([new_address]) => {
      if (new_address === undefined){
        return this._resetState();
      }
      else {this.setState({user_address:new_address})
        this._initialize(new_address);
      }
    });

    // handle the event: chain changed...we reset the dapp state
    window.ethereum.on("chainChanged", ([network_id]) => {
      this._resetState();
    });

  }

  // Here we check if the URl_RPC section in Metamask/Networks has been defined correctly (port 8545)
  _checkNetwork(){
    if (window.ethereum.networkVersion === Hardhat_network_id){
      return true;
    }
    else {this.setState({network_error: 'Please connect Metamask to Localhost:8545'});
      return false;
    }
  }

  // here we resets the total state, for example when the user change account
  _resetState(){
    this.setState(this.initial_state);
  }

  // network state variable will be resetted
  _dismissNetworkError(){
    this.setState({ network_error: undefined});
  }

  _initialize(a){ //this method is so important
    const provider = new ethers.providers.Web3Provider(window.ethereum) // we use the logged metamask account as a provider
    const supply_chain = new ethers.Contract(contract_address.Supply_chain, Supply_chain_artifact.abi, provider.getSigner(0)) // we define the contract object
                                               
    // now we instantiate the contract state variable of the component
    this.setState({user_address: a , contract: supply_chain})
  };

  handleChange(e){
    this.setState({value: e.target.value});
  };

  handleClick(){
    if(this.state.value === undefined) {
      alert("Please choose one of the options");
    }
    else {this.setState({click: true})}
  }

  render(){

    const components = {
      Owner : Owner ,
      Retailer : Retailer,
      Consumer : Consumer,
      Distributor : Distributor,
      Farmer : Farmer,
    }

    const ComponentToRender = components[this.state.value];

    /* Ethereum wallets inject a global API, an object, into websites visited by its users
    at windows.ethereum. This API allows to request user login and other things. We'll
    use this API to detect the Ethereum provider */
    if (window.ethereum === undefined){
      return <NoWalletDetected />;
    }
  
    // Next we ask the user to connect their wallet
    if (!this.state.user_address){
      return (
        <ConnectWallet connectWallet = {this._connectWallet}
                     network_error = {this.state.network_error}
                     dismsiss = {this._dismissNetworkError} 
        />
      );
    }

    if (this.state.click){
      return ( 
      <ComponentToRender contract={this.state.contract} 
        user_address={this.state.user_address}/> )
    }
    // We're ready to render the application
    return(
      <div>
      <div className = "container p-4">
        <div className="row justify-content-md-center">
          <div className="col-12 text-center">
            <h1>
              Supply chain Dapp
            </h1><br/>
            <p>
              Welcome <b>{this.state.user_address}</b>.<br/>
              <br/>
              You can buy and sell everything, come on!!!<br/><br/>
            </p>
              <p>Before you start, who you are?</p>
            <div className="radio-inline" value={this.state.value} onClick={this.handleChange}>
              <label>
                <input  type="radio" name="inlineRadioOptions" id="inlineRadio0"  value='Farmer'/>
                <span></span> Farmer
              </label><br/>
              <label>
              <input  type="radio" name="inlineRadioOptions" id="inlineRadio1"  value='Distributor'/>
                <span></span>  Distributor
              </label><br/>
              <label>
                <input  type="radio" name="inlineRadioOptions" id="inlineRadio2"  value='Retailer'/>
                <span> </span> Retailer
              </label><br/>
              <label>
                <input  type="radio" name="inlineRadioOptions" id="inlineRadio3"  value='Consumer'/>
                <span> </span> Consumer
              </label><br/>
              <label>
                <input  type="radio" name="inlineRadioOptions" id="inlineRadio4"  value='Owner'/>
                <span> </span> Owner
              </label><br/>
              <hr/>
            </div>
            <div>
              <button type="button" className="btn btn-success" onClick={()=>this.handleClick()}>Confirm</button>
            </div>
          </div>     
        </div>
      </div>
      </div>
    );
  }
}


export default App;