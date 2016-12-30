import Nprogress from 'nprogress'
import * as util from './util'
import Bus from './bus'
import View from './view'
import {notice} from 'wept-sdk'

let curr = null
let views = {}
let tabViews = {}

function normalize(p) {
  return p.replace(/\.html/, '').replace(/^\.?\//, '')
}

function onRoute() {
  util.redirectTo(curr.url)
  Bus.emit('route', getViewIds().length, curr)
  let arr = []
  let view = curr
  while (view) {
    arr.push(view.url)
    if (view.pid != null) {
      view = getViewById(view.pid)
    } else {
      view = null
    }
  }
  let str = arr.reverse().join('|')
  sessionStorage.setItem('routes', str)
}

export function redirectTo(path) {
  path = normalize(path)
  if (!curr) throw new Error('Current view not exists')
  let pid = curr.pid
  curr.destroy()
  delete views[curr.id]
  let v = curr = new View(path)
  curr.pid = pid
  views[curr.id] = v
  onRoute()
}

export function navigateTo(path) {
  path = normalize(path)
  let exists = tabViews[path]
  if (curr) curr.hide()
  if (exists) {
    curr = exists
    exists.show()
  } else {
    let isTabView = util.isTabbar(path)
    let pid = curr ? curr.id : null
    let v = curr = new View(path)
    curr.pid = isTabView ? null : pid
    views[v.id] = v
    if (isTabView) tabViews[path] = curr
  }
  onRoute()
}

export function switchTo(path) {
  let p = normalize(path)
  let find = false
  Object.keys(views).forEach(key => {
    let view = views[key]
    if (p == view.path) {
      find = view
    } else if (!util.isTabbar(view.path)) {
      view.destroy()
      delete views[key]
    }
  })
  if (!find) {
    return notice(`无法找到存在的 ${path} 页面`, {type: 'error'})
  }
  curr = find
  curr.show()
  Nprogress.done()
  onRoute()
}

export function navigateBack(delta = 1, onBack) {
  if (!curr) throw new Error('Current page not exists')
  if (curr.pid == null) return
  for (let i = delta; i > 0; i--) {
    if (curr.pid == null) break;
    curr.destroy()
    delete views[curr.id]
    curr = views[curr.pid]
    if (onBack) onBack()
  }
  curr.show()
  onRoute()
}

export function openExternal (url) {
  if (curr) curr.hide()
  let pid = curr ? curr.id : null
  let v = curr = new View(url)
  views[v.id] = v
  v.pid = pid
  v.show()
  onRoute()
}

export function currentView() {
  return curr
}

export function getViewById(id) {
  return views[id]
}

export function getViewIds() {
  let ids = Object.keys(views).map(id => Number(id))
  return ids
}

export function eachView(fn) {
  let ids = getViewIds()
  ids.forEach(id => {
    fn.call(null, views[id])
  })
}
