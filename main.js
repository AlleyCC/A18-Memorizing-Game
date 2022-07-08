//宣告controller
//設定遊戲狀態: controller會依照遊戲狀態分配動作 => 先建立遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardMatchFailed: 'CardMatchFailed',
  CardMatched: 'CardMatched',
  GameFinished: 'GameFinished',
}

//不會變動的資料，命名時開頭直接使用大寫
Symbols = ['https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png',   //黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png',  //愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png',  //方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png']   //梅花







// MVC(Model-view-controller)模組化程式碼=>把函式變成物件，每個函式只做一件事
//一個放進資料夾並加上標籤的概念
//!!注意!!property跟property之間一定要用逗號隔開


const view = {
  getCardElement (index){    //卡片覆蓋
    
    return `<div class="card back" data-index="${index}"></div>`
  },
  getCardContent (index){     //翻牌
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <p>${number}</p>
      <img src="${symbol}">
      <p>${number}</p>
    `
  },
  displayCards (indexes) {
    const rootElement = document.querySelector('#cards')
    //Array.from()會回傳一個新的array，所以最後必須加上join('')，這樣回傳進innerHTML才能順利在畫面上顯示
    rootElement.innerHTML = indexes.map((index) => this.getCardElement(index)).join('')
  },
  transformNumber (number) {     //有可能出現四種狀況，故用switch
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number  
    }
  },
  flipCards (...cards) {
    //回傳正面
    cards.map(card => {
      if (card.classList.contains('back')){
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))  //利用dataset.index取得每張卡片的索引數字
        return
      }
      //回傳背面
      card.classList.add('back')
      card.innerHTML = null
    })
  },
  pairCards (...cards){
    cards.map(card => {
      card.classList.add('paired')
    })
  },
  renderScore (score) {
    document.querySelector('.score').innerHTML = `<h2 class="score">Score: ${score}</h2>`
  },
  renderTriedTimes(times) {
    document.querySelector('.tried').innerHTML = `<p class="tried">You've tried: ${times} times.</p>`
  },
  appendWrongAnimation (...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event =>
      event.target.classList.remove('wrong'), {once: true})   //加入{once, true}在動畫執行完成後卸載監聽器
    })
  },
  showGameFinished () {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>Youe've tried: ${model.triedTimes} times.</p>`
    const header = document.querySelector('#header')
    header.before(div)
  }
}

const utility = {
  getRandomNumberArray (count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index --){
      let randomIndex = Math.floor(Math.random() * (index + 1))  //分號的意義=>讓瀏覽器解析時可以清楚知道分號前面已結束
      ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]] //解構賦值的寫法，前面的分號不可省略
    }
    return number
  }
}

//宣告model
//集中管理資料的地方
const model = {
  revealedCards: [],    //暫存翻牌的地方，檢查翻牌點數是否相符，檢查完便清空    
  isRevealedCardMatched () {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },
  score: 0,
  triedTimes: 0
}

//盡量使用controller呼叫函式，不要動到view和utility
const controller = {
  currentState: GAME_STATE.FirstCardAwaits,   //洗牌 + 隨機發牌
  generateCards () {
    view.displayCards(utility.getRandomNumberArray(52))
  },
  dispatchCardAction (card) {                     
    //排除已翻牌的情況
    if (!card.classList.contains('back')) return
    //開始翻牌
    switch (this.currentState) {
      //翻第一張
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      // 翻第二張
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(model.triedTimes++)
        view.flipCards(card)
        model.revealedCards.push(card)
        
        if (model.isRevealedCardMatched(card)) {   //判斷是否配對成功
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardMatched
          view.pairCards(...model.revealedCards)
          model.revealedCards = []  //清空暫存卡片陣列
          if (model.score === 260) {
            this.currentState = GAME_STATE.FirstCardAwaits
            view.showGameFinished()
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {   // 配對失敗  
          this.currentState = GAME_STATE.CardMatchFailed
          view.appendWrongAnimation(...model.revealedCards)    //加入動畫
          setTimeout(this.resetCards, 1000)  //this.resetCards後面記得不要加()，因為這裡是引入函式，若加上()會變成引入resetCards函式的回傳值(=>a.k.a 回傳了一個參數進去)
        }    
    }
    console.log('this.currentState', this.currentState )
    console.log('revealedCards', model.revealedCards.map((item) => item.dataset.index))
  },
  resetCards () {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []      //翻回背面後，清空暫存卡片陣列
    controller.currentState = GAME_STATE.FirstCardAwaits    //狀態回到firstCardAwaits
  }
}


controller.generateCards()


//在每一個card上綁上一個監聽器
document.querySelectorAll('.card').forEach((card) => {card.addEventListener('click', function(){
  // controller.generateCard()
  controller.dispatchCardAction(card)
  })
})