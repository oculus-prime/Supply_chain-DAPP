import React from 'react';
import '../App.css';
//const {ethers} = require('ethers');

/*What happens here?
1)Just the contract's owner can access to this part of the Dapp
2)Owner can add and remove farmer
3)Owner can add and remove distributor
4)Owner can add and remove retailer
5)Owner can remove consumer
6)Owner can destruct the contract
*/
class Owner extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOwner: undefined,
      loading: undefined
    };
  }

  async componentDidMount() {
    await this.updateOwnerStatus(this.props.user_address)
  }

  /* componentDidUpdate checks if user address it's changed from the previous render,
       if yes, then it calls the updateOwnerStatus passing the new user address... */
  async componentDidUpdate(prevProps){
    if (prevProps.user_address !== this.props.user_address){
      await this.updateOwnerStatus()
    }
  }

  async updateOwnerStatus(){
    const isOwner = await this.props.contract.isOwner(); //check ownership
    if (isOwner.toString() === 'false' || isOwner.toString() === 'true') {
      this.setState({ isOwner, loading: true })
    }
  }

  async handle_allTransaction(func, ...args) {
    let tx, receipt;
    try {
      tx = await func(...args);
      receipt = tx.wait()
      if (receipt.status === 0) {
        // we cant know the exact error that made the transaction fail when it was mined, so we thrown this generic one
        throw new Error('Transaction failed')
      } else { console.log(tx.hash + ' has been completed') }
    } catch (error) {
      console.error(error.message);
      alert('Error, open console for more details');
    }
  }

  render() {
    const loading = this.state.loading
    const isOwner = this.state.isOwner
    const element = <div className='warning'>You're not the owner, you can't do that</div>
    return (
      <div>
        {loading ? (
          isOwner ? <Compilation contract={this.props.contract} user_address={this.props.user_address}
            handle_allTransaction={this.handle_allTransaction} /> : element
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

function Compilation({ contract, user_address, handle_allTransaction }) {

  async function handleDestruct() {
    return handle_allTransaction(contract.destruct)
  }

  async function handleAddFarmer({ _address, _name, _seat }) {
    await handle_allTransaction(contract.addFarmer, _address, _name, _seat)
  }

  async function handleAddRetailer({ _address, _name, _seat }) {
    return handle_allTransaction(contract.addRetailer,
      _address, _name, _seat)
  }

  async function handleAddDistributor({ _address, _name }) {
    return handle_allTransaction(contract.addDistributor,
      _address, _name)
  }

  async function handleRemove({ _address }) {
    return handle_allTransaction(contract.removeFarmer, _address)
  }

  async function handleRemove_D({ _address }) {
    return handle_allTransaction(contract.removeDistributor, _address)
  }

  async function handleRemove_R({ _address }) {
    return handle_allTransaction(contract.removeRetailer, _address)
  }

  async function handleRemove_C({ _address }) {
    return handle_allTransaction(contract.removeConsumer, _address)
  }

  return (
    <div className='container p-4'>
      <div className='row justify-content-md-center'>
        <div className='col-12 text-center'>
          <h3>
            Hi, owner
          </h3><br />
          <p>
            You can perform many activities. In the console you'll receive the outcome of the transaction
          </p>
          <hr />
          <h5><b>Destruct the supply_chain contract</b></h5>
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();

                if (e.target._input.value.toLowerCase() === 'yes') {
                  handleDestruct()
                }

              }}
            >
              <div className='form-group'>
                <label>
                  Are you sure you want to destroy this contract?
                </label>
                <input
                  className='form-control' name='_input'
                  type='text' style={{ textAlign: 'center', margin: '0 auto', width: '20%' }}
                  placeholder='Response' required /><br />
                <input className="btn btn-primary" type="submit" value='Destruct' />
              </div>
            </form>
          </div>
          <hr className='solid' />
          <h5><b>Add a farmer</b></h5>
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();

                const formData = new FormData(e.target);
                const _address = formData.get('_address');
                const _name = formData.get('_name');
                const _seat = formData.get('_seat');

                if (_address && _name && _seat) {
                  handleAddFarmer({ _address, _name, _seat })
                }
              }}
            >
              <div className='form-inline'>
                <div className='form-group'>
                  <label style={{ paddingRight: '6px' }}>
                    Insert address
                  </label>
                  <input
                    className='form-control'
                    type='text'
                    name='_address'
                    placeholder='address: 0x...'
                    required
                  />
                  <label style={{ marginLeft: '30px', paddingRight: '6px' }}>
                    Insert name
                  </label>
                  <input
                    className='form-control'
                    type='text'
                    name='_name'
                    placeholder='Name of the firm'
                    required
                  />
                  <label style={{ marginLeft: '30px', paddingRight: '6px' }} >
                    Insert the seat
                  </label>
                  <input
                    className='form-control'
                    type='text'
                    name='_seat'
                    placeholder='Seat of the firm'
                    required
                  />
                </div>
              </div><br />
              <div className='form-group'>
                <input className='btn btn-primary' type='submit' value='Submit' />
              </div>
            </form>
          </div>
          <hr className='solid' />
          <h5><b>Remove a farmer</b></h5>
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRemove(e.target._input.value)
              }}
            >
              <div className='form-group'>
                <label>
                  Insert the address
                </label>
                <input
                  className='form-control' name='_input'
                  type='text' style={{ textAlign: 'center', margin: '0 auto', width: '20%' }}
                  placeholder='address' required /><br />
                <input className="btn btn-primary" type="submit" value='Remove' />
              </div>
            </form>
          </div>
          <hr className='solid' />
          <h5><b>Add a retailer</b></h5>
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();

                const formData = new FormData(e.target);
                const _address = formData.get('_address');
                const _name = formData.get('_name');
                const _seat = formData.get('_seat');

                if (_address && _name && _seat) {
                  handleAddRetailer({ _address, _name, _seat })
                }
              }}
            >
              <div className='form-inline'>
                <div className='form-group'>
                  <label style={{ paddingRight: '6px' }}>
                    Insert address
                  </label>
                  <input
                    className='form-control'
                    type='text'
                    name='_address'
                    placeholder='address: 0x...'
                    required
                  />
                  <label style={{ marginLeft: '30px', paddingRight: '6px' }}>
                    Insert name
                  </label>
                  <input
                    className='form-control'
                    type='text'
                    name='_name'
                    placeholder='Name of the firm'
                    required
                  />
                  <label style={{ marginLeft: '30px', paddingRight: '6px' }} >
                    Insert the seat
                  </label>
                  <input
                    className='form-control'
                    type='text'
                    name='_seat'
                    placeholder='Seat of the firm'
                    required
                  />
                </div>
              </div><br />
              <div className='form-group'>
                <input className='btn btn-primary' type='submit' value='Submit' />
              </div>
            </form>
          </div>
          <hr className='solid' />
          <h5><b>Remove a retailer</b></h5>
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRemove_R(e.target._input.value)
              }}
            >
              <div className='form-group'>
                <label>
                  Insert the address
                </label>
                <input
                  className='form-control' name='_input'
                  type='text' style={{ textAlign: 'center', margin: '0 auto', width: '20%' }}
                  placeholder='address' required /><br />
                <input className="btn btn-primary" type="submit" value='Remove' />
              </div>
            </form>
          </div>
          <hr className='solid' />
          <h5><b>Add a distributor</b></h5>
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();

                const formData = new FormData(e.target);
                const _address = formData.get('_address');
                const _name = formData.get('_name');

                if (_address && _name) {
                  handleAddDistributor({ _address, _name })
                }
              }}
            >
              <div className='form-inline'>
                <div className='form-group'>
                  <label style={{ marginLeft: '180px', paddingRight: '6px' }}>
                    Insert address
                  </label>
                  <input
                    className='form-control'
                    type='text'
                    name='_address'
                    placeholder='address: 0x...'
                    required
                  />
                  <label style={{ marginLeft: '30px', paddingRight: '6px' }}>
                    Insert name
                  </label>
                  <input
                    className='form-control'
                    type='text'
                    name='_name'
                    placeholder='Name of the firm'
                    required
                  />
                </div>
              </div><br />
              <div className='form-group'>
                <input className='btn btn-primary' type='submit' value='Submit' />
              </div>
            </form>
          </div>
          <hr className='solid' />
          <h5><b>Remove a distributor</b></h5>
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRemove_D(e.target._input.value)
              }}
            >
              <div className='form-group'>
                <label>
                  Insert the address
                </label>
                <input
                  className='form-control' name='_input'
                  type='text' style={{ textAlign: 'center', margin: '0 auto', width: '20%' }}
                  placeholder='address' required /><br />
                <input className="btn btn-primary" type="submit" value='Remove' />
              </div>
            </form>
          </div>
          <hr className='solid' />
          <h5><b>Remove a consumer</b></h5>
          <div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRemove_C(e.target._input.value)
              }}
            >
              <div className='form-group'>
                <label>
                  Insert the address
                </label>
                <input
                  className='form-control' name='_input'
                  type='text' style={{ textAlign: 'center', margin: '0 auto', width: '20%' }}
                  placeholder='address' required /><br />
                <input className="btn btn-primary" type="submit" value='Remove' />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )

}

export default Owner;
