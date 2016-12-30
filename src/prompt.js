import {storage} from 'wept-sdk'
import merge from 'merge'

function systemInfo() {
  return {
    model: /iPhone/.test(navigator.userAgent) ? 'iPhone6' : 'Android',
    pixelRatio: window.devicePixelRatio || 1,
    windowWidth: window.innerWidth || 0,
    windowHeight: window.innerHeight || 0,
    language: window.navigator.userLanguage || window.navigator.language,
    platform: 'wept',
    version: "6.3.9"
  }
}

function toResult(msg, data, command) {
  var obj = {
    ext: data,
    msg: msg
  }
  if (command) obj.command = command
  return obj
}

function toError(data, extra = {}) {
  //let name = data.sdkName.replace(/Sync$/, '')
  let name = data.sdkName
  let obj = merge.recursive(true, {
    errMsg: `${name}:fail`
  }, extra)
  return toResult(obj, data,'GET_ASSDK_RES')
}

function toSuccess(data, extra = {}) {
  //let name = data.sdkName.replace(/Sync$/, '')
  let name = data.sdkName
  let obj = merge.recursive(true, {
    errMsg: `${name}:ok`
  }, extra)
  return toResult(obj, data,'GET_ASSDK_RES')
}

export function setStorageSync(data) {
  let args = data.args
  if (args.key == null || args.data == null) return toError(data)
  storage.set(args.key, args.data, args.dataType)
  return toSuccess(data)
}

export function getStorageSync(data) {
  let args = data.args
  if (args.key == null || args.key == '') return toError(data)
  let res = storage.get(args.key)
  return toSuccess(data, {
    data: res.data,
    dataType: res.dataType
  })
}

export function clearStorageSync(data) {
  storage.clear()
  return toSuccess(data)
}

export function removeStorageSync(data) {
  let args = data.args
  if (args.key == null || args.key == '') return toError(data)
  storage.remove(args.key)
  return toSuccess(data)
}

export function getStorageInfoSync(data) {
  let obj = storage.info()
  return toSuccess(data, obj)
}

export function getSystemInfoSync(data) {
  let info = systemInfo()
  return toSuccess(data, info)
}

export function getSystemInfo(data) {
  let info = systemInfo()
  return toSuccess(data, info)
}

