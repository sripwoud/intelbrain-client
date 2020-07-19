import React, { Component } from 'react'
import Particles from 'react-particles-js'
import FaceRecognition from './components/FaceRecognition/FaceRecognition'
import Navigation from './components/Navigation/Navigation'
import Signin from './components/Signin/Signin'
import Register from './components/Register/Register'
import Logo from './components/Logo/Logo'
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm'
import Rank from './components/Rank/Rank'
import Modal from './components/Modal'
import Profile from './components/Profile/Profile'
import './App.css'

const particlesOptions = {
  particles: {
    number: {
      value: 30,
      density: {
        enable: true,
        value_area: 800
      }
    }
  }
}

const initialState = {
  input: '',
  imageUrl: '',
  boxes: [],
  route: 'signin',
  isSignedIn: false,
  isProfileOpen: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: '',
    pet: '',
    age: ''
  }
}

class App extends Component {
  constructor() {
    super()
    this.state = initialState
  }

  componentDidMount() {
    const token = window.sessionStorage.getItem('token')
    if (token) {
      fetch(`https://intelbrain-api.herokuapp.com/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.id) {
            fetch(`https://intelbrain-api.herokuapp.com/profile/${data.id}`, {
              method: 'get',
              headers: { Authorization: token }
            })
              .then(res => res.json())
              .then(user => {
                if (user && user.email) {
                  this.loadUser(user)
                  this.onRouteChange('home')
                }
              })
          }
        })
    }
  }

  loadUser = data => {
    this.setState({
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined
      }
    })
  }

  calculateFacesLocation = data => {
    if (data && data.outputs) {
      return data.outputs[0].data.regions.map(region => {
        const clarifaiFace = region.region_info.bounding_box
        const image = document.getElementById('inputimage')
        console.log(image)
        const width = Number(image.width)
        const height = Number(image.height)
        return {
          leftCol: clarifaiFace.left_col * width,
          topRow: clarifaiFace.top_row * height,
          rightCol: width - clarifaiFace.right_col * width,
          bottomRow: height - clarifaiFace.bottom_row * height
        }
      })
    } else {
      return
    }
  }

  displayFacesBox = boxes => {
    if (boxes) {
      this.setState({ boxes })
    }
  }

  onInputChange = event => {
    this.setState({ input: event.target.value })
  }

  onButtonSubmit = () => {
    this.setState({ imageUrl: this.state.input })
    fetch(`https://intelbrain-api.herokuapp.com/imageurl`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: window.sessionStorage.getItem('token')
      },
      body: JSON.stringify({
        input: this.state.input
      })
    })
      .then(response => response.json())
      .then(response => {
        if (response) {
          fetch(`https://intelbrain-api.herokuapp.com/image`, {
            method: 'put',
            headers: {
              'Content-Type': 'application/json',
              Authorization: window.sessionStorage.getItem('token')
            },
            body: JSON.stringify({
              id: this.state.user.id
            })
          })
            .then(response => response.json())
            .then(count => {
              this.setState(Object.assign(this.state.user, { entries: count }))
            })
            .catch(console.log)
        }
        this.displayFacesBox(this.calculateFacesLocation(response))
      })
      .catch(err => console.log(err))
  }

  onRouteChange = route => {
    if (route === 'signout') {
      return this.setState(initialState)
    } else if (route === 'home') {
      this.setState({ isSignedIn: true })
    }
    this.setState({ route })
  }

  toggleModal = () => {
    this.setState(prevState => ({
      ...prevState,
      isProfileOpen: !prevState.isProfileOpen
    }))
  }

  render() {
    const {
      isSignedIn,
      imageUrl,
      route,
      boxes,
      isProfileOpen,
      user
    } = this.state
    return (
      <div className='App'>
        <Particles className='particles' params={particlesOptions} />
        <Navigation
          isSignedIn={isSignedIn}
          onRouteChange={this.onRouteChange}
          toggleModal={this.toggleModal}
        />
        {isProfileOpen && (
          <Modal>
            <Profile
              user={user}
              isProfileOpen={isProfileOpen}
              toggleModal={this.toggleModal}
              loadUser={this.loadUser}
            />
          </Modal>
        )}
        {route === 'home' ? (
          <div>
            <Logo />
            <Rank
              name={this.state.user.name}
              entries={this.state.user.entries}
            />
            <ImageLinkForm
              onInputChange={this.onInputChange}
              onButtonSubmit={this.onButtonSubmit}
            />
            <FaceRecognition boxes={boxes} imageUrl={imageUrl} />
          </div>
        ) : route === 'signin' ? (
          <Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
        ) : (
          <Register
            loadUser={this.loadUser}
            onRouteChange={this.onRouteChange}
          />
        )}
      </div>
    )
  }
}

export default App
