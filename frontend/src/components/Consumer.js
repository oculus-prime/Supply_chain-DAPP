import React from 'react';
import { useState, useEffect } from 'react';
import '../App.css';
import consumer from './consumer.jpg'
import arrow from './arrow-right.svg'
const {ethers} = require('ethers');

/* What happens here?
1) If a user is not registered as consumer, he can signup providing no data, just a 'yes' response
2) Consumer has a view of the  product that are ready to be sold by retailers
3) Consumer can buy this products
4) He can check the entire supply chain for that product (who is the farmer, who is the distributor, who is the retailer)
*/

class Consumer extends React.Component{
    constructor(props){
        super(props);
        this.state = { isConsumer: undefined,
                       loading: undefined};
        this.handle_allTransaction = this.handle_allTransaction.bind(this);
    }

    async componentDidMount(){ 
      await this.updateConsumerStatus(this.props.user_address)
    }

    async componentDidUpdate(prevProps){
      if (prevProps.user_address !== this.props.user_address){
        await this.updateConsumerStatus(this.props.user_address)
      }
    }

    async updateConsumerStatus(userAddress){
      const isConsumer = await this.props.contract.isConsumer(userAddress); //check if the user is a retailer
      if (isConsumer.toString()==='false' || isConsumer.toString()==='true'){
        this.setState({isConsumer, loading:true})
      }
    }

    async handle_allTransaction(func, ...args){
        let tx, receipt;
        try {
            tx = await func(...args);
            receipt = tx.wait()
            if (receipt.status===0){
                // we cant know the exact error that made the transaction fail when it was mined, so we thrown this generic one
                throw new Error('Transaction failed')
            } else {console.log(tx.hash + ' has been completed')
                    this.setState({isConsumer: true})}
        } catch (error) {
            console.error(error.message);
            alert('Error, open console for more details');
        }
    }

    render(){
        
      const isConsumer = this.state.isConsumer
      const loading = this.state.loading

      return(
        <div>
          {loading ? (
            isConsumer ? <Compilation contract={this.props.contract} /> : 
                         <Element contract={this.props.contract} handle_allTransaction={this.handle_allTransaction} />
          ) : (
            null // We're in a local blockchain, transaction are faster, so we dont need to use a Loading div
            /* <div>
              <div style={{textAlign:'center', marginTop:'6px'}}><h2>Loading...</h2></div>
              <img src={loading_image} className="App-logo" alt="loading" />
            </div> */
          )}
        </div>
      )
    }
}
      
  
  
function Compilation ({contract}){

  const [value, setValue] = useState(null);
  const [_weight_1, setValue_1] = useState(null);
  const [_unique_id_1, setValue_2] = useState(null);
  const [name_ret_1, setValue_3] = useState(null);
  const [data, setData] = useState([]);
  const [control_hooks, setC] = useState(0);
  const [supplyChainData, setSupplyChainData] = useState({});

  /* Initially the proportion and so the price to be paid were computed in back-end
  But in solidity is not so safe perform this type of computation (many errors can be faced
  as divsion by zero, or float number)... Thus I take out it and has been placed here.
  Consequently I need to take out also the maximum weight check, namely the max quantity that a distributor
  can buy from a farmer, in that way I obtain a correct estimate of the price*/
  
  async function handle_Price({_weight, _unique_id, _name_ret}){
    let price_tobe_paid, proportion, weight, price;
    let w = Math.round(_weight)  // to avoid float to be passed in solidity
    try { 
      const struct_product_d = await contract.mapping_r(_unique_id, _name_ret)
      weight = struct_product_d.weight_kg
      if (weight>0){    // in that way we check if the unique_id is valid
        price = ethers.utils.formatEther(struct_product_d.price)
        if (w > weight){ // I use the max quantity avaialble, obviously this will be comunicated
          price_tobe_paid = price
          w = weight
          setValue(price_tobe_paid.toString())
          alert('Maximum quantity available is '+ w)
        }else {
          proportion = (weight * 100) / price; 
          price_tobe_paid = ((100 * w) / proportion).toFixed(6); // considering the actual price of ETH is useless go further the 6th decimal
          setValue(price_tobe_paid.toString())}
        
        setValue_1(w)
        setValue_2(_unique_id)
        setValue_3(_name_ret)}
      else {throw new Error ('Product not available')}
    }catch (error) {
      console.error(error.message)
      alert('Error, open console for more details') // there are many reasons for which a tx fails
    }
    
  }

  // Here there is the effective purchase
  async function onClick(_weight, _unique_id, name_retailer, value){
    let tx, receipt;
        try {
            tx = await contract.final_buy(Math.round(_weight), _unique_id, ethers.utils.parseEther(value), 
                                                                    name_retailer, {value: ethers.utils.parseEther(value)})
            receipt = await tx.wait(1)
            if (receipt.status===0){
                // we cant know the exact error that made the transaction fail when it was mined, so we thrown this generic one
                throw new Error('Transaction failed')
            } else {console.log(tx.hash + ' has been completed')
                    setC(control_hooks+1)}
        } catch (error) {
            console.error(error.message);
            alert('Error, open console for more details');
        }
    }

  /* I wanna show all products that are ready to be sold and available to be bought by consumer
     We do this kind of search using emitted events '_Exhibited', so we create a filter object and
     then we seach between the mined blocks the objects that respect the filter, then we catch the unique_id
     and show the various features. Before show them, we check if they are still available.
    We'll use useEffect hook*/

  useEffect(()=>{
    async function handleShow_products(){
      let eventFilter = contract.filters._Exhibited() // filter object
      let matched_receipts = await contract.queryFilter(eventFilter) // perform search between blocks
      let filteredData = []
      for (let i=0; i<matched_receipts.length ;i++){
        let unique_id = matched_receipts[i].args.unique_id
        let address = matched_receipts[i].args.owner
        let name_retailer = await contract.name_r(address)
        let u = await contract.mapping_r(unique_id, name_retailer)
        if (u.weight_kg>0){
          filteredData.push(u)
        }
      }
      setData(filteredData)
    }

    handleShow_products();
  }, [contract, control_hooks])


  /* This is the main function, the function that provides the entire supply chain of a product.
     We create two filter objects: the first one is referred to the event _Sold_to_Retailer (unique id from *distributor to retailer).
     Then we pass this filter to queryFilter method, in that way I obtain all the receipts that respect my constraints. From these
     receipt I catch the distributor, and then we define the second filter object respect to the event _Sold_to_Distributor (
     unique id from *farmer to distributor), we catch the farmer and then we display farmer->distributor->retailer. */

  async function handleSupply_chain({_unique_id, _ret_address}){
    let farmer, retailer;
    try {
      let eventFilter_1 = contract.filters._Sold_to_Retailer(_unique_id, null, _ret_address)
      let matched_receipts = await contract.queryFilter(eventFilter_1)
      /* We wanna manage the case (unprobable) that a retailer buys the same product (unique id)
         from two different distributors, so we implement a for cycle where we push each name distributor inside a list*/
      let distributors = []
      for (let i=0; i<matched_receipts.length; i++){
        let address_distributor = matched_receipts[i].args.from
        distributors.push(address_distributor)
      }
      /* Here we wanna find the farmer... we don t need to implement a cycle for, to check each distributor,
         becasue the farmer of a product (characterized by a unique_id) is one and only one, 
         so we take a distributor from the list*/
      let eventFilter_2 = contract.filters._Sold_to_Distributor(_unique_id, null, distributors[0])
      let matched_receipts_2 = await contract.queryFilter(eventFilter_2)
      let address_farmer = matched_receipts_2[0].args.from
      // call component function that it will render the supply chain
      let farmer_name= await contract.name_f(address_farmer);
      let farmer_seat = await contract.seat_f(farmer_name);
      let retailer_name = await contract.name_r(_ret_address);
      let retailer_seat = await contract.seat_r(retailer_name);
      if (farmer_name && retailer_seat){
        farmer = {
          address: address_farmer,
          name : farmer_name,
          seat : farmer_seat
        }
        retailer = {
          address: _ret_address,
          name: retailer_name,
          seat: retailer_seat
        }
      }

      setSupplyChainData({farmer, distributors, retailer, contract});
    } catch (error){
      console.error(error.message);
      alert('Error, open console for more details');
    }
  }


  return(
    <div>
      <div className='container p-4'>
        <div className='row justify-content-md-center'>
          <div className='col-12 text-center'>
            <h3>Hi Consumer</h3><br />
            <p>You can perform many activities. In the console you'll receive the outcome of your transaction</p>
            {data.length > 0 ?
              (<div> These products are ready to be sold: <br />
                <div className="row">
                  {data.map((item, index) => (
                    <div key={index} className="col-md-4 border-width">
                      <br />
                      <b>Unique_id</b>: {item.unique_id.toString()} <br />
                      <b>Product name</b>: {item.product_name} <br />
                      <b>Quantity in kg</b>: {item.weight_kg} <br />
                      <b>Price in ETH</b>: {ethers.utils.formatEther(item.price.toString())} <br />
                      <b>Retailer name</b>: {item.ret_name} <br />
                      <b>Retailer seat</b>: {item.ret_seat} <br />
                      <b>Retailer address</b>: <br/><span className='font'>{item.ret_address} </span><br />
                      <b>Production date</b>: {(new Date(item.production_date * 1000)).toLocaleDateString()} <br />
                      <b>Expiration date</b>: {(new Date(item.expiration_date * 1000)).toLocaleDateString()}<br />
                      <br />
                    </div>))}
                </div>
              </div>
              ) : (<div>At the moment, no products are ready to be sold</div>)}
            <hr className='solid' />
            <h5 style={{ marginTop: '30px' }}><b>Buy a product</b></h5>
            <br />
            <form
              onSubmit={(e) => {
                e.preventDefault();

                const formData = new FormData(e.target);
                const _weight = formData.get('_weight');
                const _unique_id = formData.get('_unique_id');
                const _name_ret = formData.get('_name_ret')

                if (_weight && _unique_id && _name_ret) {
                  handle_Price({ _weight, _unique_id, _name_ret })
                }
              }}>
              <div className='form-inline'>
                <div className='form-group'>
                  <label style={{ marginLeft: '1px', paddingRight: '6px' }}
                  ><b>Insert name retailer</b></label>
                  <input
                    className='form-control'
                    type='text'
                    style={{ width: '12%' }}
                    name='_name_ret'
                    placeholder='Name'
                    required
                  />
                  <label style={{ marginLeft: '25px', paddingRight: '6px' }}>
                    <b>Insert unique id</b>
                  </label>
                  <input
                    className='form-control'
                    type='text'
                    style={{ width: '15%' }}
                    name='_unique_id'
                    placeholder='unique_id'
                    required
                  />
                  <label style={{ marginLeft: '25px', paddingRight: '10px' }}><b> Insert weight</b></label>
                  <div className='form-inline'>
                    <div className='input-group-addon-left'>Kg</div>
                    <input
                      className='form-control'
                      style={{ width: '40%' }}
                      type='text'
                      name='_weight'
                      placeholder='Weight in Kg'
                      required
                    />
                    <div className='input-group-addon-right'>.00</div>
                  </div>
                </div>
              </div><br />
              <div className='form-group'>
                <input className='btn btn-warning' type='submit' value='Show the price' />
              </div>
            </form>
            {value && <p>ETH: {value}</p>}
            {value &&
              <button className='btn btn-primary' onClick={() => onClick(_weight_1, _unique_id_1, name_ret_1, value)}>
                Submit
              </button>}
            <hr className='solid' />
            <h5 style={{ marginTop: '30px' }}><b>Check the entire supply chain about a product</b></h5>
            <br />
            <form
              onSubmit={(e) => {
                e.preventDefault();

                const formData = new FormData(e.target);
                const _unique_id = formData.get('_unique_id');
                const _ret_address = formData.get('_ret_address')

                if (_unique_id && _ret_address) {
                  handleSupply_chain({ _unique_id, _ret_address })
                }
              }}>
              <div className='form-inline'>
                <div className='form-group'>
                  <label style={{ marginLeft: '110px', paddingRight: '6px' }}><b>Insert unique id</b></label>
                  <input
                    className='form-control'
                    style={{ width: '25%' }}
                    type='text'
                    name='_unique_id'
                    placeholder='unique id'
                    required
                  />
                  <label style={{ marginLeft: '50px', paddingRight: '6px' }}><b>Insert retailer address</b></label>
                  <input
                    className='form-control'
                    type='text'
                    name='_ret_address'
                    placeholder='address'
                    required
                  />
                </div>
              </div><br />
              <div className='form-group'>
                <input className='btn btn-warning' type='submit' value='Check supply chain' />
              </div>
            </form>
            {supplyChainData.farmer && (
      <SupplyChainInformation
        farmer={supplyChainData.farmer}
        distributors={supplyChainData.distributors}
        retailer={supplyChainData.retailer}
        contract={supplyChainData.contract}
      />
    )}
          </div>
        </div>
      </div>
    </div>
  )

}

async function fetchDistributorInformation(contract, distributorAddress) {
  let distributorName = await contract.name_d(distributorAddress);
  return { distributorName };
}

function SupplyChainInformation({ farmer, distributors, retailer, contract }) {
  const [distributorInformation, setDistributorInformation] = useState([]);
  useEffect(() => {
    async function fetchData() {
      let information = [];
      for (let i = 0; i < distributors.length; i++) {
        information.push(await fetchDistributorInformation(contract, distributors[i]));
      }
      setDistributorInformation(information);
    }
    fetchData();
  }, [contract, distributors]);

  return(
    <div className="form-inline" style={{ marginLeft: '30px', marginTop: '30px' }}>
      <div className="square">
        <p><b>Farmer name</b> : <br />{farmer.name}<br />
           <b>Farmer seat</b> : <br />{farmer.seat}<br />
           <b>Farmer address</b> : <span className='font_1'>{farmer.address}</span>
        </p>
      </div>
      <div className="arrow">
        <img src={arrow} alt='arrow' style={{ width: '30px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}> 
        {distributorInformation.map((item, index) => (
          <div key={index}>
            <div className="square">
              <p><b>Distributor name</b> : <br />{item.distributorName}<br />
                <b>Distributor address</b> : <span className='font_1'>{distributors[index]}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="arrow">
        <img src={arrow} alt='arrow' style={{ width: '30px' }} />
      </div>
      <div className="square">
        <p><b>Retailer name</b> : <br />{retailer.name}<br />
           <b>Retailer seat</b> : <br />{retailer.seat}<br />
           <b>Retailer address</b> : <span className='font_1'>{retailer.address}</span>
        </p>
      </div>
    </div>
  )
}

function Element({contract, handle_allTransaction}){

  //Consumer signup
  async function handleAddC(){
    return await handle_allTransaction(contract.addConsumer)}

  return (
    <div>
        <div className='warning'>You're not a Consumer, you can't do that</div>
          <div className='container p-4'>
            <div className='row justify-content-md-center'>
              <div className='col-12 text-center'>
                <br/>
                <div> <h4><b>But you can sign in</b></h4></div><br/>
                  <form
                    onSubmit={(e)=>{
                      e.preventDefault();

                      const formData = new FormData(e.target);
                      const response = formData.get('_input');

                      if (response.toLowerCase()==='yes'){
                        handleAddC()
                      }
                  }}>
                    <div className='form-group'>
                      <label><b> You wanna be a consumer? </b></label>
                      <input
                        className='form-control' name='_input'
                        type='text' style={{ textAlign: 'center', margin: '0 auto', width: '20%' }}
                        placeholder='Response' required />
                    </div><br />
                    <div className='form-group' style={{marginTop:'-10px'}}>
                      <input className='btn btn-primary' type='submit' value='Submit' />
                    </div>
                  </form>
                  <div class="text-center">
                    <img src={consumer} className="rounded" style={{marginTop:'-15px', height:'310px'}} alt="Consumer"/>
                </div>
              </div>
            </div>
          </div>
    </div>
  
  )
}



export default Consumer;