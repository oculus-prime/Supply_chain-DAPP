import React from 'react';
import { useState, useEffect } from 'react';
import '../App.css';
 
const {ethers} = require('ethers');

/* What happens here?
1) If a user is not registered as distributor, he can signup
2) Distributor has a view of the 'manufactured' product
3) Distributor can buy this products
4) He can make available this products to retailers
*/

class Distributor extends React.Component{
    constructor(props){
        super(props);
        this.state = { isDistributor: undefined,
                       loading: undefined};
        this.handle_allTransaction = this.handle_allTransaction.bind(this);
    }

    async componentDidMount(){ // we wait the promise satisfaction before rendering all, becasue i put a conditional rendering based on loading
        await this.updateDistributorStatus(this.props.user_address);
    }

    /* componentDidUpdate checks if user address it's changed from the previous render,
       if yes, then it calls the updateRetailerStatus passing the new user address... */
    async componentDidUpdate(prevProps){
      if (prevProps.user_address !== this.props.user_address){
        await this.updateDistributorStatus(this.props.user_address)
      }
    }

    async updateDistributorStatus(userAddress){
      const isDistributor = await this.props.contract.isDistributor(userAddress); //check if he's a distributor
      if (isDistributor.toString()==='false' || isDistributor.toString()==='true'){
        this.setState({isDistributor, loading:true})
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
                    this.setState({isDistributor: true})}
        } catch (error) {
            console.error(error.message);
            alert('Error, open console for more details');
        }
    }

    render(){
        
      const isDistributor = this.state.isDistributor
      const loading = this.state.loading

      return(
        <div>
          {loading ? (
            isDistributor ? <Compilation contract={this.props.contract} /> : 
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
  const [data, setData] = useState([]);
  const [control_hooks, setC] = useState(0); // this state variable allow to control useEffect, when there is a purchase, update
                                             // the products

  /* Initially the proportion and so the price to be paid were computed in back-end
  But in solidity is not so safe perform this type of computation (many errors can be faced)
  as divsion by zero, or float number... Thus I take out it and has been placed here.
  Consequently I need to take out also the maximum weight check, namely the max quantity that a distributor
  can buy from a farmer, in that way I obtain a correct estimate of the price*/
  
  async function handle_Price({_weight, _unique_id}){
    let price_tobe_paid, proportion, weight, price;
    let w = Math.round(_weight)  // to avoid float to be passed in solidity
    try { 
      const struct_product_m = await contract.mapping_m(_unique_id)
      weight = struct_product_m.weight_kg
      if (weight>0){    // in that way we check if the unique_id is valid
        price = ethers.utils.formatEther(struct_product_m.price)
        if (w > weight){ // I use the max quantity avaialble, obviously this will be comuncated
          price_tobe_paid = price
          w = weight
          setValue(price_tobe_paid.toString())
          alert('Maximum quantity available is '+ w)
        }else {
          proportion = (weight * 100) / price; 
          price_tobe_paid = ((100 * w) / proportion).toFixed(6);
          setValue(price_tobe_paid.toString())}

        setValue_1(w)
        setValue_2(_unique_id)}
      else {throw new Error ('Product not available')}
    }catch (error) {
      console.error(error.message)
      alert('Error, open console for more details') // there are many reasons for which a tx fails
    }
    
  }

  // Here there is the effective purchase
  async function onClick(_weight, _unique_id, value){
    let tx, receipt;
        try {
            tx = await contract.buy_D_product(Math.round(_weight), _unique_id, ethers.utils.parseEther(value), {value: ethers.utils.parseEther(value)}) //
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

  /* The distributor makes avalaible to retailers his product
    (Obviously the back-end checks if this product exists or belongs to him)
     In this function the distributor defines the new price  
     New price: I take it in ETH in frontend, and in backend I  send it in wei, since no float in solidity*/

  async function handleAvailable_d({_unique_id, new_price}){
    let tx,receipt
    try {
      tx = await contract.available_d(_unique_id, ethers.utils.parseEther(new_price)) //
      receipt = await tx.wait(1)
      if (receipt.status === 0){
        throw new Error('Transaction failed')
      } else {console.log(tx.hash + ' has been completed')}
    } catch (error){
      console.error(error.message);
      alert('Error, open console for more details')
    }
  }

  /* I wanna show all products that are manufactured and available to be bought by distributors 
     We do this kind of search using emitted events '_Manufactured', so we create a filter object and
     then we seach between the mined blocks the objects that respect the filter, then we catch the unique_id
     and show the various features. Before show them, we check if they are still available.
     We'll use useEffect hook */

  useEffect(()=>{
    async function handleShow_products(){
      let eventFilter = contract.filters._Manufactured() // filter object
      let matched_receipts = await contract.queryFilter(eventFilter) // perform search between blocks
      let filteredData = []
      for (let i=0; i<matched_receipts.length ;i++){
        let unique_id = matched_receipts[i].args.unique_id
        let u = await contract.mapping_m(unique_id)
        if (u.weight_kg>0){ // here we check if the product is still available to farmer
          filteredData.push(u)
        }
      }
      setData(filteredData)
    }

    handleShow_products();
  }, [contract, control_hooks])



  return(
    <div>
      <div className='container p-4'>
        <div className='row justify-content-md-center'>
          <div className='col-12 text-center'>
            <h3>Hi Distributor</h3><br />
            <p>You can perform many activities. In the console you'll receive the outcome of your transaction</p> <br />
            {data.length > 0 ?
              (<div> These manufactured products are available: <br />
                <div className="row">
                  {data.map((item, index) => (
                    <div key={index} className="col-md-3 border-width">
                      <br />
                      <b>Unique_id</b>: {item.unique_id.toString()} <br />
                      <b>Product name</b>: {item.product_name} <br />
                      <b>Quantity in kg</b>: {item.weight_kg} <br />
                      <b>Price in ETH</b>: {ethers.utils.formatEther(item.price)} <br />
                      <b>Farm name</b>: {item.farm_name} <br />
                      <b>Farm seat</b>: {item.farm_seat} <br />
                      <b>Production date</b>:{(new Date(item.production_date * 1000)).toLocaleDateString()} <br />
                      <b>Expiration date</b>: {(new Date(item.expiration_date * 1000)).toLocaleDateString()}<br />
                      <br />
                    </div>))}
                </div>
              </div>
              ) : (<div>At the moment, no manufactured product is available</div>)}
            <hr className='solid' />
            <h5 style={{ marginTop: '30px' }}><b>Buy a product</b></h5>
            <br />
            <form
              onSubmit={(e) => {
                e.preventDefault();

                const formData = new FormData(e.target);
                const _weight = formData.get('_weight');
                const _unique_id = formData.get('_unique_id');

                if (_weight && _unique_id) {
                  handle_Price({ _weight, _unique_id })
                }
              }}>
              <div className='form-inline'>
                <div className='form-group'>
                  <label style={{ marginLeft: '90px', paddingRight: '10px' }}><b> Insert weight</b></label>
                  <div className='form-inline'>
                    <div className='input-group-addon-left'>Kg</div>
                    <input
                      className='form-control'
                      type='text'
                      name='_weight'
                      placeholder='Weight in Kg'
                      required
                    />
                    <div className='input-group-addon-right'>.00</div>
                  </div>
                  <label
                    style={{ marginLeft: '60px', paddingRight: '10px' }} >
                    <b> Insert unique_id</b></label>
                  <input
                    className='form-control'
                    type='text'
                    name='_unique_id'
                    placeholder='unique_id'
                    required
                  />
                </div>
              </div><br />
              <div className='form-group'>
                <input className='btn btn-warning' type='submit' value='Show the price' />
              </div>
            </form>
            {value && <p>ETH: {value}</p>}
            {value &&
              <button className='btn btn-primary' onClick={() => onClick(_weight_1, _unique_id_1, value)}>
                Submit
              </button>}
            <hr className='solid' />
            <h5 style={{ marginTop: '30px' }}><b>Makes available your product to retailers</b></h5>
            <p>(Obviusly with a new price, if you wanna to earn!!!)</p>
            <br />
            <form
              onSubmit={(e) => {
                e.preventDefault()

                const formData = new FormData(e.target);
                const _unique_id = formData.get('_unique_id');
                const new_price = formData.get('new_price')

                if (_unique_id && new_price) {
                  handleAvailable_d({ _unique_id, new_price })
                }
              }}>
              <div className='form-inline'>
                <div className='form-group'>
                  <label style={{ marginLeft: '100px', paddingRight: '6px' }}>
                    <b>Insert unique_id</b>
                  </label>
                  <input
                    className='form-control'
                    type='text'
                    name='_unique_id'
                    placeholder='unique_id'
                    required
                  />
                  <label style={{ marginLeft: '110px', paddingRight: '6px' }} >
                    <b>Insert new price </b>
                  </label>
                  <div className='form-inline'>
                    <div className='input-group-addon-left'>ETH</div>
                    <input
                      className='form-control'
                      type='text'
                      name='new_price'
                      placeholder='new price'
                      required
                    />
                  </div>
                </div>
              </div><br />
              <div className='form-group'>
                <input className='btn btn-primary' type='submit' value='Submit' />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
  
}

function Element({contract, handle_allTransaction}){

  //Distributor signup
  async function handleAddD({_name}){
    return await handle_allTransaction(contract.addDistributor_signup,_name)}

  return (
    <div>
      <div className='warning'>You're not a distributor, you can't do that</div>
      <div className='container p-4'>
        <div className='row justify-content-md-center'>
          <div className='col-12 text-center'>
            <br />
            <div> <h4><b>But you can sign in</b></h4></div><br />
            <form
              onSubmit={(e) => {
                e.preventDefault();

                const formData = new FormData(e.target);
                const _name = formData.get('_name');
                const response = formData.get('_input')

                if (_name && response.toLowerCase() === 'yes') {
                  handleAddD({ _name })
                }
              }}>
              <div className='form-group'>
                <label><b> Insert name </b></label>
                <input
                  className='form-control'
                  type='text'
                  style={{ width: '40%', marginLeft: '330px' }}
                  name='_name'
                  placeholder='Name of the firm'
                  required
                /><br />
                <label><b> Are you sure? </b></label>
                <input
                  className='form-control' name='_input'
                  type='text' style={{ textAlign: 'center', margin: '0 auto', width: '20%' }}
                  placeholder='Response' required /><br />
              </div><br />
              <div className='form-group'>
                <input className='btn btn-primary' type='submit' value='Submit' />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

  )
}

  export default Distributor;