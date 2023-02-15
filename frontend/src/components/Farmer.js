import React from 'react';
import { useState } from 'react';
import '../App.css';
 
const {ethers} = require('ethers');

/*What happens here?
  1) If a farmer is not registered, here he can signup
  2) He can make available his products (appear in dapp)
*/

class Farmer extends React.Component{
    constructor(props){
        super(props);
        this.state = { isFarmer: undefined, loading:undefined};
        this.handle_allTransaction = this.handle_allTransaction.bind(this);
    }

    async componentDidMount() {
      await this.updateFarmerStatus(this.props.user_address);
    }
    
    /* componentDidUpdate checks if user address it's changed from the previous render,
       if yes, then it calls the updateFarmerStatus passing the new user address... */
    async componentDidUpdate(prevProps) {
      if (prevProps.user_address !== this.props.user_address) {
        await this.updateFarmerStatus(this.props.user_address);
      }
    }
  
    async updateFarmerStatus(userAddress) {
      const isFarmer = await this.props.contract.isFarmer(userAddress);
      if (isFarmer.toString() === "false" || isFarmer.toString() === "true") {
        this.setState({ isFarmer, loading: true });
      }
    }

    //Here all the functions are executed passing through a try/catch expression 
    async handle_allTransaction(func, ...args){
        let tx, receipt;
        try {
            tx = await func(...args);
            receipt = tx.wait()
            if (receipt.status===0){
                // we cant know the exact error that made the transaction fail when it was mined, so we thrown this generic one
                throw new Error('Transaction failed')
            } else {console.log(tx.hash + ' has been completed')
                    this.setState({isFarmer: true})}
        } catch (error) {
            console.error(error.message);
            alert('Error, open console for more details');
        }
    }

    render(){
        
      const isFarmer = this.state.isFarmer
      const loading = this.state.loading

      return(
          <div>
            {loading ? (
              isFarmer ? <Compilation contract={this.props.contract}/> : 
              <Element contract={this.props.contract} handle_allTransaction={this.handle_allTransaction}/>
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

  const [uniqueId, setUniqueId] = useState(null);

  // here the products are put on sale 
  async function handleCreateProduct({_weight, _price, _product_name}){
    let tx, receipt;
        try {
            tx = await contract.createProduct(Math.round(_weight),ethers.utils.parseEther(_price), _product_name) // we convert eth->wei and pass it to solidity
            receipt = await tx.wait()
            if (receipt.status===0){
                // we cant know the exact error that made the transaction fail when it was mined, so we thrown this generic one
                throw new Error('Transaction failed')
            } else {console.log(tx.hash + ' has been completed')
                    const eventt = receipt.events?.filter((x)=>{return x.event === '_Manufactured'})
                    setUniqueId(eventt[0].args.unique_id.toString())}
        } catch (error) {
            console.error(error.message);
            alert('Error, open console for more details');
        }
    }


  return(
    <div>
      <div className='container p-4'>
        <div className='row justify-content-md-center'>
          <div className='col-12 text-center'>
            <div style={{ marginTop: '25px' }}> <h3><b>Create the product, here we fill the blockchain with the infos of your new product</b></h3></div>
            <br /><br />
            <form
              onSubmit={(e) => {
                e.preventDefault();

                const formData = new FormData(e.target);
                const _weight = formData.get('_weight');
                const _price = formData.get('_price');
                const _product_name = formData.get('_product_name');

                if (_weight && _price && _product_name) {
                  handleCreateProduct({ _weight, _price, _product_name })
                }
              }}>
              <div className='form-group'>
                <label><b> Insert weight</b></label>
                <div className='form-inline'>
                  <div className='input-group-addon-left' style={{ marginLeft: '350px' }}>Kg</div>
                  <input
                    className='form-control'
                    type='text'
                    style={{ width: '27%', marginLeft: '0px' }}
                    name='_weight'
                    placeholder='Weight in Kg'
                    required
                  />
                  <div className='input-group-addon-right'>.00</div>
                </div>
                <br /><br />
                <label><b> Insert price</b><br />
                  (use the dot not the comma for decimals)
                </label>
                <div className='form-inline'>
                  <div className='input-group-addon-left' style={{ marginLeft: '350px' }}>ETH</div>
                  <input
                    className='form-control'
                    type='text'
                    style={{ width: '30%', marginLeft: '0px' }}
                    name='_price'
                    placeholder='Price in ETH'
                    required
                  />
                </div>
                <br /><br />
                <label><b> Insert product name</b></label>
                <input
                  className='form-control'
                  type='text'
                  style={{ width: '35%', marginLeft: '350px' }}
                  name='_product_name'
                  placeholder='Name of the product'
                  required
                />
              </div><br />
              <div className='form-group'>
                <input className='btn btn-primary' type='submit' value='Submit' />
              </div><br />
            </form>
            {uniqueId && <p>Unique id of your product is: <b>{uniqueId}</b></p>}
          </div>
        </div>
      </div>
    </div>
  )
  
}

function Element({contract, handle_allTransaction}){

  //Farmer signup
  async function handleAddF({_name, _seat}){
    return await handle_allTransaction(contract.addFarmer_signup,_name, _seat)}

  return (
    <div>
      <div className='warning'>You're not a farmer, you can't do that</div>
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
                const _seat = formData.get('_seat');

                if (_name && _seat) {
                  handleAddF({ _name, _seat })
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
                <label><b> Insert seat </b></label>
                <input
                  className='form-control'
                  type='text'
                  style={{ width: '40%', marginLeft: '330px' }}
                  name='_seat'
                  placeholder='Name of the seat'
                  required
                />
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

  export default Farmer;