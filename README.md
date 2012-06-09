**[smooth-rns](http://smoothimpact.net/) is a simple bit of [Node.JS](http://nodejs.org/) code to scrape RNS alerts from the London Stock Exchange website, store specific RNS details in a CouchDB instance and report them via Twitter direct message.**

A quick and dirty weekend project so that I can get almost real-time notification of RNS releases via twitter.  Lots of things still to do with this once I get a bit more time:
- Add some map reduce code to the project which can be used to summarise the info stored in CouchDB
- Add some NLP techniques/sentiment analysis etc to give a quick summary in the DM tweet of whether the RNS is positive or negative
- Build in share price tracking for the same stock tickers to be able to correlate price movements to RNS content
- Pull ticker list from Google Finance instead of hard coding it
- Add code for SMS alerts in specific instances

## Getting Started

- Don't expect the code to be flawless.
- Drop in your Twitter [keys](https://dev.twitter.com/apps)
- Drop in your bit.ly [key](http://bitly.com/a/create_oauth_app)
- Add your CouchDB credentials
- Enter the twitter username you want to send direct messages to
- Update the list of stock tickers you want to track
- run "node smooth-rns.js"
- Done

Follow [@smoothimpact](http://twitter.com/smoothimpact) or visit [http://smoothimpact.net/](http://smoothimpact.net/).

## Credits

smooth-rns makes heavy use of some excellent libs written by others:

- [node.js](http://nodejs.org/) from [ry](https://github.com/ry) 
- [ntwitter](https://github.com/AvianFlu/ntwitter) from [AvianFlu](https://github.com/AvianFlu)
- [node.io](https://github.com/chriso/node.io) from [ChrisO](https://github.com/chriso)
- [node-cron](https://github.com/ncb000gt/node-cron) from [ncb000gt](https://github.com/ncb000gt)
- [node-bitly](https://github.com/tanepiper/node-bitly) from [tanepiper](https://github.com/tanepiper)
- [nano](https://github.com/dscape/nano) from [dscape](https://github.com/dscape)


## License

(MIT License)

Copyright (c) 2012 Kris McConkey <kris@smoothimpact.net>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.