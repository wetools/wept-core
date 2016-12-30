import throttle from 'throttleit'
import Nprogress from 'nprogress'
import qrscan from './ui/qrscan'
import Serial from 'node-serial'
import Bus from './bus'
import * as viewManage from './viewManage'
import {onNavigate, onLaunch, onBack} from './service'
import header from './header'
import {toAppService, onSuccess, onError, onCancel} from './service'
import {getRedirectData, validPath, dataURItoBlob, toNumber} from './util'
import {
  record,
  voice,
  compass,
  notice,
  actionSheet,
  fileManage,
  downloadFile as download,
  uploadFile as upload,
  imgInfo,
  mask,
  modal,
  motion,
  music,
  Picker,
  TimePicker,
  DatePicker,
  storage,
  ImagesPreview,
  toast,
  imagePicker,
  videoPicker
} from 'wept-sdk'

let appData = {}

function requiredArgs(keys, data) {
  let args = data.args
  for (var i = 0, l = keys.length; i < l; i++) {
    if (!args.hasOwnProperty(keys[i])) {
      onError(data, `key ${keys[i]} required for ${data.sdkName}`)
      return true
    }
  }
  return false
}

export function systemLog() {
}

export function refreshSession(data) {
  // no user session
  onSuccess(data)
}

export function switchTab(data) {
  let url = data.args.url
  Nprogress.start()
  viewManage.switchTo(url)
  onNavigate(data, 'switchTab')
}

export function shareAppMessage(data) {
  let {desc, imgUrl, title} = data.args
  modal({
    title,
    imgUrl,
    content: desc
  }).then(confirm => {
    onSuccess(data, { confirm })
  })
}

export function requestPayment(data) {
  //console.log(data)
  modal({
    title: '确认支付吗？'
  }).then(confirm => {
    if (confirm) {
      onSuccess(data, {statusCode: 200})
    } else {
      onCancel(data)
    }
  })
}

export function previewImage(data) {
  let args = data.args
  let urls = args.urls
  if (!urls.length) return requiredArgs(['urls'], data)
  let current = args.current || urls[0]
  let preview = new ImagesPreview(urls, {})
  preview.show()
  preview.active(current)
  onSuccess(data)
}


export function PULLDOWN_REFRESH(data) {
  toAppService({
    msg: {
      data: {},
      eventName: "onPullDownRefresh",
      webviewID: data.webviewID
    }
  })
}

export function stopPullDownRefresh(data) {
  let curr = viewManage.currentView()
  if (curr) {
    curr.postMessage({
      command: "STOP_PULL_DOWN_REFRESH"
    })
  }
  data.sdkName = 'stopPullDownRefresh'
  onSuccess(data)
}

// publish event to views
export function publish(data) {
  let all_ids = viewManage.getViewIds()
  let ids = toNumber(data.webviewIds) || all_ids
  data.act = 'sendMsgFromAppService'
  let obj = {
    msg: data,
    command: 'MSG_FROM_APPSERVICE'
  }
  viewManage.eachView(view => {
    if (ids.indexOf(view.id) !== -1) {
      view.postMessage(obj)
    }
  })
}

export function scanCode(data) {
  qrscan().then(val => {
    onSuccess(data, {
      result: val
    })
  }, () => {
    onCancel(data)
  })
}

export function WEBVIEW_READY (data) {
  console.log(data)
}

export function redirectTo(data) {
  Nprogress.start()
  viewManage.redirectTo(data.args.url)
  onNavigate(data, 'redirectTo')
}

export function navigateTo(data) {
  let str = sessionStorage.getItem('routes')
  if (str && str.split('|').length >= 5) {
    return notice('页面栈已达上线 5 个，无法继续创建！', {type: 'error'})
  }
  Nprogress.start()
  viewManage.navigateTo(data.args.url)
  onNavigate(data, 'navigateTo')
}

export function navigateBack(data) {
  data.args = data.args || {}
  data.args.url = viewManage.currentView().path + '.html'
  let delta = data.args.delta ? Number(data.args.delta) : 1
  if (isNaN(delta)) return notice('Delta 必须为数字', {type: 'error'})
  viewManage.navigateBack(delta, () => {
    onBack()
  })
  onNavigate(data, 'navigateBack')
}

function getRoutes() {
  let root = window.__root__
  let path = location.hash.replace(/^#!/, '')
  if (sessionStorage == null) return path ? [path] : [root]
  let str = sessionStorage.getItem('routes')
  if (!str) return path ? [path] : [root]
  let routes = str.split('|')
  if (routes.indexOf(path) !== routes.length - 1) {
    return path ? [path] : [root]
  }
  return routes
}

export function APP_SERVICE_COMPLETE(data) { //eslint-disable-line
  Bus.emit('APP_SERVICE_COMPLETE')
  let routes = getRoutes()
  let first = routes.shift()
  let valid = validPath(first)
  if (!valid) console.warn(`Invalid route: ${first}, redirect to root`)
  // make sure root is valid page
  let root =  valid ? first : window.__root__
  viewManage.navigateTo(root)
  onLaunch(root)
  if (!valid) return
  if (routes.length) {
    mask.show()
    let cid = viewManage.currentView().id
    Bus.once('ready', id => {
      if (id !== cid) return mask.hide()
      let serial = new Serial()
      serial.timeout(10000)
      for (let route of routes) {
        // check if in pages
        valid = validPath(route)
        if (!valid) {
          console.warn(`无法在 pages 配置中找到 ${route}，停止路由`)
          break;
        }
        serial.add(cb => {
          let data = getRedirectData(`/${route}`, viewManage.currentView().id)
          toAppService(data)
          Bus.once('ready', () => cb())
        })
      }
      serial.done(err => {
        mask.hide()
        if (err) {
          console.error(err.stack)
          notice(err.message, {type: 'error'})
          return
        }
      })
    })
  }
}

export function GET_APP_DATA(data) {
  window.postMessage({
    to: data.comefrom,
    comefrom: 'backgroundjs',
    msg: {
      appData: appData
    },
    command: 'SEND_APP_DATA',
  }, '*')
}

export function WRITE_APP_DATA(data) {
  appData = data.data
  toAppService({
    command: 'WRITE_APP_DATA',
    msg: appData
  })
}

export function GET_APP_STORAGE(data) {
  let res = storage.getAll()
  window.postMessage({
    to: data.comefrom,
    msg: {
      storage: res
    },
    command: 'SET_APP_STORAGE'
  }, '*')
}

export function DELETE_APP_STORAGE(data) {
  if (!data.data || !data.data.key) return console.error('key not found')
  storage.remove(data.data.key)
}

export function SET_APP_STORAGE(data) {
  let d = data.data
  if (!d || !d.key || !d.type)  return console.error('wrong arguments')
  storage.set(d.key, d.value, d.type)
}

storage.on('change', () => {
  let res = storage.getAll()
  window.postMessage({
    to: 'devtools-storage',
    msg: {
      storage: res
    },
    command: 'SET_APP_STORAGE'
  }, '*')
})

export function send_app_data(data) {
  appData = data.appData
  window.postMessage({
    to: 'devtools-appdata',
    msg: {
      appData: appData
    },
    command: 'SEND_APP_DATA'
  }, '*')
}

export function setNavigationBarTitle(data) {
  let title = data.args.title
  if (title) header.setTitle(title)
}

export function showNavigationBarLoading() {
  header.showLoading()
}

export function hideNavigationBarLoading() {
  header.hideLoading()
}

export function chooseImage(data) {
  imagePicker().then(arr => {
    let paths = arr.map(o => o.url)
    if (paths.length) {
      onSuccess(data, { tempFilePaths: paths })
    } else {
      onCancel(data)
    }
  })
}

export function chooseVideo(data) {
  videoPicker().then(res => {
    onSuccess(data, {
      duration: res.duration,
      size: res.size,
      height: res.height,
      width: res.width,
      tempFilePath: res.url
    })
  })
}

export function saveFile(data) {
  let url = data.args.tempFilePath
  if (!url) return requiredArgs(['tempFilePath'], data)
  fileManage.save(url).then(savedPath => {
    onSuccess(data, {
      savedFilePath: savedPath
    })
  }, onError.bind(null, data))
}

export function enableCompass() {
  let id = compass.watch(throttle(direction => {
    toAppService({
      msg: {
        eventName: 'onCompassChange',
        type: 'ON_APPLIFECYCLE_EVENT',
        data: {
          direction: direction
        }
      }
    })
  }, 200))
  compass.unwatch(id)
  viewManage.currentView().on('destroy', () => {
    compass.unwatch(id)
  })
}

export function enableAccelerometer() {
  if (!window.DeviceMotionEvent) return
  motion.watch(throttle(res => {
    if (res.x == null) return
    toAppService({
      msg: {
        eventName: 'onAccelerometerChange',
        type: 'ON_APPLIFECYCLE_EVENT',
        data: res
      }
    })
  }, 200))
  viewManage.currentView().on('destroy', () => {
    motion.unwatch()
  })
}

export function getNetworkType(data) {
  let type = navigator.connection == null ? 'WIFI' : navigator.connection.type
  onSuccess(data, {
    networkType: type
  })
}

export function getLocation(data) {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(position => {
      let coords = position.coords
      onSuccess(data, {
        longitude: coords.longitude,
        latitude: coords.latitude
      })
    })
  } else {
    onError(data, 'geolocation not supported')
  }
}

export function openLocation(data) {
  let args = data.args
  let url = "http://apis.map.qq.com/tools/poimarker?type=0&marker=coord:" + args.latitude + "," + args.longitude + "&key=JMRBZ-R4HCD-X674O-PXLN4-B7CLH-42BSB&referer=wxdevtools"
  viewManage.openExternal(url)
  Nprogress.done()
  onSuccess(data, {
    latitude: args.latitude,
    longitude: args.longitude
  })
}

export function chooseLocation(data) {
  let url = `https://3gimg.qq.com/lightmap/components/locationPicker2/index.html?search=1&type=1&coord=39.90403%2C116.407526&key=JMRBZ-R4HCD-X674O-PXLN4-B7CLH-42BSB&referer=wxdevtools`
  viewManage.openExternal(url)
  Nprogress.done()
  let called = false
  Bus.once('back',() => {
    if (!called) {
      called = true
      onCancel(data)
    }
  })
  Bus.once('location', location => {
    if (!called) {
      called = true
      if (location) {
        onSuccess(data, location)
      } else {
        onCancel(data)
      }
    }
  })
}

export function setStorage(data) {
  let args = data.args
  storage.set(args.key, args.data, args.dataType)
  if (args.key == null || args.key == '') {
    return onError(data, 'key required')
  }
  onSuccess(data)
}

export function getStorage(data) {
  let args = data.args
  if (args.key == null || args.key == '') {
    return onError(data, 'key required')
  }
  let res = storage.get(args.key)
  onSuccess(data, {
    data: res.data,
    dataType: res.dataType
  })
}

export function clearStorage(data) {
  storage.clear()
  onSuccess(data)
}

export function startRecord(data) {
  record.startRecord({
    success: url => {
      onSuccess(data, {
        tempFilePath: url
      })
    },
    fail: err => {
      return onError(data, err.message)
    }
  }).catch((e) => {
    console.warn(`Audio record failed: ${e.message}`)
  })
}

export function stopRecord(data) {
  record.stopRecord().then(url => {
    onSuccess(data, {tempFilePath: url})
  }, onError.bind(null, data))
}

export function playVoice(data) {
  let url = data.args.filePath
  if (!url) return requiredArgs(['url'], data)
  voice.play(url).then(() => {
    onSuccess(data)
  }, onError.bind(null, data))
}

export function pauseVoice() {
  voice.pause()
}

export function stopVoice() {
  voice.stop()
}

music.on('error', e => {
  toAppService({
    msg: {
      message: e.message,
      eventName: 'onMusicError',
      type: 'ON_MUSIC_EVENT'
    }
  })
})

export function getMusicPlayerState(data) {
  let obj = music.getStatus()
  onSuccess(data, obj)
}

export function operateMusicPlayer(data) {
  let args = data.args
  switch (args.operationType) {
    case 'play':
      music.play(args.dataUrl)
      toAppService({
        msg: {
          eventName: 'onMusicPlay',
          type: 'ON_MUSIC_EVENT'
        }
      })
      break
    case 'pause':
      music.pause()
      toAppService({
        msg: {
          eventName: 'onMusicPause',
          type: 'ON_MUSIC_EVENT'
        }
      })
      break
    case 'seek':
      music.seek(args.position)
      break
    case 'stop':
      music.stop()
      toAppService({
        msg: {
          eventName: 'onMusicEnd',
          type: 'ON_MUSIC_EVENT'
        }
      })
      break
  }
  onSuccess(data)
}

export function uploadFile(data) {
  let args = data.args
  if (!args.filePath || !args.url) return requiredArgs(['filePath', 'url'], data)
  // TODO allow custom remote
  upload({
    filePath: args.filePath,
    url: args.url,
    name: args.name,
    headers: args.header,
    formData: args.formData
  }, '/remoteProxy').then(res => {
    onSuccess(data, {statusCode: res.status})
  }, onError.bind(null, data))
}

export function downloadFile(data) {
  let args = data.args
  if (!args.url) return requiredArgs(['url'], data)
  // TODO custom proxy
  download(args.url, args.header, '/remoteProxy').then(res => {
    onSuccess(data, res)
  }, onError.bind(null, data))
}

export function getSavedFileList(data) {
  fileManage.getFileList().then(list => {
    onSuccess(data, {
      fileList: list
    })
  }, onError.bind(null, data))
}

export function removeSavedFile(data) {
  let args = data.args
  if (requiredArgs(['filePath'], data)) return
  fileManage.removeFile(args.filePath).then(() => {
    onSuccess(data, {})
  }, onError.bind(null, data))
}

export function getSavedFileInfo(data) {
  let args = data.args
  if (requiredArgs(['filePath'], data)) return
  fileManage.getFileInfo(args.filePath).then(info => {
    onSuccess(data, info)
  }, onError.bind(null, data))
}

export function openDocument(data) {
  let args = data.args
  if (requiredArgs(['filePath'], data)) return
  onSuccess(data)
  modal({
    title: 'openDocument',
    content: args.filePath
  }).then(() => {
    onSuccess(data)
  })
}

export function getStorageInfo(data) {
  let info = storage.info()
  onSuccess(data, info)
}

export function removeStorage(data) {
  let args = data.args
  if (requiredArgs(['key'], data)) return
  let o = storage.remove(args.key)
  onSuccess(data, {data: o})
}

export function showToast(data) {
  if (requiredArgs(['title'], data)) return
  toast.show(data.args)
  onSuccess(data)
}

export function hideToast(data) {
  toast.hide()
  onSuccess(data)
}

export function showModal(data) {
  if (requiredArgs(['title', 'content'], data)) return
  modal(data.args).then(confirm => {
    onSuccess(data, { confirm })
  })
}

export function showActionSheet(data) {
  let args = data.args
  if (requiredArgs(['itemList'], data)) return
  if (!Array.isArray(args.itemList)) return onError(data, 'itemList must be Array')
  args.itemList = args.itemList.slice(0, 6)
  actionSheet(args).then(res => {
    onSuccess(data, res)
  })
}

export function getImageInfo(data) {
  if (requiredArgs(['src'], data)) return
  imgInfo(data.args.src).then(res => {
    onSuccess(data, res)
  }, err => {
    onError(data, err.message)
  })
}

export function base64ToTempFilePath(data) {
  let uri = data.args.base64Data
  // args.canvasId
  onSuccess(data, {
    filePath: dataURItoBlob(uri)
  })
}


export function showPickerView(data, args) {
  const picker = new Picker(args)
  picker.show()
  //picker.on('cancel', () => {})
  picker.on('select', n => {
    publishPagEevent('bindPickerChange', {
      type: 'change',
      detail: {
        value: n + ''
      }
    })
  })
}

export function showDatePickerView(data, args) {
  let picker
  let eventName
  if (args.mode == 'time') {
    eventName = 'bindTimeChange'
    picker = new TimePicker(args)
  } else {
    eventName = 'bindDateChange'
    picker = new DatePicker(args)
  }
  picker.show()
  picker.on('select', val => {
    publishPagEevent(eventName, {
      type: 'change',
      detail: {
        value: val
      }
    })
  })
}

function publishPagEevent(eventName, extra) {
  let obj = {
    command: 'MSG_FROM_WEBVIEW',
    msg: {
      data: {
        data: {
          data: extra,
          eventName
        }
      },
      eventName: 'publish_PAGE_EVENT',
    }
  }
  toAppService(obj)
}
