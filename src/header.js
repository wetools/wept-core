import cx from 'classnames'
import React, {Component} from 'react'
import ReactDom from 'react-dom'
import {storage, notice, actionSheet} from 'wept-sdk'
import Bus from './bus'
import {currentView} from './viewManage'
import qrcode from './ui/qrcode'
import * as util from './util'

class Header extends Component {
  constructor(props) {
    super(props)
    let win = window.__wxConfig__['window']
    this.state = {
      backgroundColor: win.navigationBarBackgroundColor,
      color: win.navigationBarTextStyle,
      title: win.navigationBarTitleText,
      loading: false,
      backText: '返回',
      back: false,
      sendText: false
    }
    Bus.on('route', this.reset.bind(this))
  }
  reset() {
    let win = window.__wxConfig__['window']
    let d = {
      backgroundColor: win.navigationBarBackgroundColor,
      color: win.navigationBarTextStyle,
      title: win.navigationBarTitleText,
      loading: false,
      back: false
    }
    let curr = currentView()

    let winConfig = win.pages[curr.path] || {}
    let tabBar = window.__wxConfig__.tabBar

    let top = tabBar && tabBar.position == 'top'
    let hide = top && util.isTabbar(curr.url)
    if (curr.isMap) {
      this.setState({
        hide: true,
        backgroundColor: 'rgb(0, 0, 0)',
        color: '#ffffff',
        title: '位置',
        loading: false,
        backText: '取消',
        sendText: true
      })
    } else {
      this.setState({
        hide,
        backgroundColor: winConfig.navigationBarBackgroundColor || d.backgroundColor,
        color: winConfig.navigationBarTextStyle || d.color,
        title: winConfig.navigationBarTitleText || d.title,
        loading: false,
        backText: '返回',
        sendText: false,
        back: curr.pid != null
      })
    }
  }
  onBack(e) {
    e.preventDefault()
    Bus.emit('back')
  }
  onSend(e) {
    // TODO send location
    e.stopPropagation()
    Bus.emit('location', currentView().location)
    this.onBack(e)
  }
  onOptions(e) {
    e.preventDefault()
    actionSheet({
      itemList: [
        '分享',
        '回主页',
        '手机访问',
        '清除数据缓存',
        '问题反馈']
    }).then(res => {
      if (res.cancel) return
      switch (res.tapIndex) {
        case 0:
          Bus.emit('share')
          break
        case 1:
          window.sessionStorage.removeItem('routes')
          util.navigateHome()
          break
        case 2:
          qrcode.show()
          break
        case 3:
          if (window.localStorage != null) {
            storage.clear()
            notice('数据缓存已清除', {type: 'success'})
          }
          break
        case 4:
          window.location.href = 'https://github.com/chemzqm/wept/issues'
          break
        default:
          throw new Error('internal error')
      }
    })
  }
  setTitle(title) {
    this.setState({title})
  }
  showLoading() {
    this.setState({
      loading: true
    })
  }
  hideLoading() {
    this.setState({
      loading: false
    })
  }
  onHome() {
    util.navigateHome()
  }
  render() {
    let state = this.state
    let iconStyle = {
      borderLeft: `1px solid ${state.color}`,
      borderBottom: `1px solid ${state.color}`
    }
    let clz = cx('head-option-icon', {
      'white': state.color == 'white'
    })
    let homeClz = cx('head-home-icon', {
      'white': state.color == 'white'
    })

    return (
      <div style={{backgroundColor: state.backgroundColor, display: state.hide ? 'none' : 'flex'}}>
        <div onClick={this.onBack} className="head-back" style={{display: state.back ? 'flex' : 'none' }}>
          {do {
            if (!state.sendText) <i className="head-back-icon" style={iconStyle}></i>
          }}
          <span style={{color: state.color}}>{state.backText}</span>
        </div>
        <div onClick={this.onHome} className="head-home" style={{display: state.back ? 'none' : 'flex' }}>
          <i className={homeClz}></i>
        </div>
        <h3 className="head-title" style={{color: state.color}}>
          <i className="head-title-loading" style={{display: state.loading? 'inline-block' : 'none'}}></i>
          <span>{state.title}</span>
        </h3>
        <div className="head-option" onClick={this.onOptions.bind(this)}>
          {do {
            if (state.sendText) <div onClick={this.onSend.bind(this)}>发送</div>
            else <i className={clz}></i>
          }}
        </div>
      </div>
    )
  }
}

let header = React.createElement(Header, null)
export default ReactDom.render(header, document.querySelector('.head'))
