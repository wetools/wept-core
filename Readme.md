# wept-core

 **W.I.P**

微信小程序开发工具 WEPT 控制层代码，依赖 [wept-sdk](https://github.com/wetools/wept-sdk)

实现方式：

* 使用 [react](https://facebook.github.io/react) 实现 header 和 tabbar 组件
* 原生方法/组件由 [wept-sdk](https://github.com/wetools/wept-sdk) 提供
* 控制层负责控制和管理小程序的 view 和 service 层（可通过 iframe/webview
  实现），不同层通过 window.postMessage 方法进行通信。


## 使用方式

``` js
import core, {reloadJavascript, reloadWxss, reloadWxml} from 'wept-core'
// config core
core({
  tag: 'iframe' // should either be iframe or webview, default to 'iframe'
  rootUrl: '/app' // root url of current app, default to `/app`
  wxConfig: {    // config of wxapp
   ...
  }
})

reloadJavascript(path_to_javascript) // js 文件相对于程序根路径的相对路径
reloadWxss(path_to_wxss) // wxss 文件相对于程序根路径的相对路径
reloadWxml(path_to_wxml) // wxml 文件相对于程序根路径的相对路径
```

## LICENSE

Copyright 2016 chemzqm@gmail.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
