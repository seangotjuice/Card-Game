"strict mode";
// 宣告遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
};
let currentState = GAME_STATE.FirstCardAwaits;
let revealedCards = [];
let score = 0;

const Symbols = [
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png", // 黑桃
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png", // 愛心
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png", // 方塊
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png", // 梅花
];

// 計時器（新增功能）
const timer = setInterval(function () {
  // 若倒數時間 > 0
  if (Number(document.querySelector(".timer").textContent) > 0) {
    document.querySelector(".timer").textContent =
      Number(document.querySelector(".timer").textContent) - 1;
  } else {
    // 倒數時間 < 0
    view.showGameFinished(false);
    // 不能再翻牌了
    controller.currentState = GAME_STATE.GameFinished;
  }
}, 1000);

// -------------顯示-----------
const view = {
  // 翻開
  getCardContent(index) {
    // 13張為一輪
    const number = this.transformNumbers((index % 13) + 1);
    const symbol = Symbols[Math.floor(index / 13)];
    return `
        <p>${number}</p>
        <img src="${symbol}" />
        <p>${number}</p>
      `;
  },
  // 覆蓋（初始化就被呼叫）
  getCardElement(index) {
    return `
      <div class="card back" data-index="${index}">
      </div>`;
  },
  // 特殊數字符號
  transformNumbers(n) {
    switch (n) {
      case 1:
        return "A";
      case 11:
        return "J";
      case 12:
        return "Q";
      case 13:
        return "K";
      default:
        return n;
    }
  },
  // 初始化UI
  displayCards(i) {
    const rootElement = document.querySelector("#cards");

    rootElement.innerHTML = i
      // 回傳洗完牌的數字陣列
      .map((n) => this.getCardElement(n))
      .join("");
  },
  // 錯誤翻牌動畫
  appendWrongAnimation(...card) {
    card.map((c) => {
      c.classList.add("wrong");
      c.addEventListener(
        "animationend",
        (e) => e.target.classList.remove("wrong"),
        { once: true }
      );
    });
  },

  // 翻牌與蓋牌
  flipCards(...card) {
    // rest 把 (x, y) -> [x, y]
    card.map((card) => {
      if (card.classList.contains("back")) {
        // 回傳正面
        card.classList.remove("back");
        card.innerHTML = this.getCardContent(Number(card.dataset.index));
        return;
      }
      // 回傳背面
      card.classList.add("back");
      card.innerHTML = null; //清空<p> <img> <p>
    });
  },

  // 配對成功
  pairCard(...card) {
    card.map((c) => {
      c.classList.add("paired");
    });
  },

  // 遊戲結束（新增功能）
  showGameFinished(win) {
    //
    // 結束計時器
    clearTimeout(timer);

    if (win) {
      document.querySelector("#end-game").classList.add("win-game");
      document.querySelector("#message").textContent = "YOU WIN!!!";
      // 卡片動畫特效（只動翻開的）
      document.querySelectorAll(".card").forEach((el) => {
        if (!el.classList.contains("back")) el.classList.add("shaking");
      });
    } else {
      document.querySelector("#end-game").classList.add("loose-game");
      document.querySelector("#message").textContent = "GAME OVER!";
      // 卡片動畫特效（只動覆蓋的）
      document.querySelectorAll(".card").forEach((el) => {
        if (el.classList.contains("back")) el.classList.add("shaking");
      });
    }
  },

  // score, count
  renderScore(p) {
    document.querySelector(".score").textContent = `Paired: ${p}/3`;
  },
  renderCount(c) {
    document.querySelector(".tried").textContent = `You've tried ${c} times`;
  },
};

// -------------流程---------------
const controller = {
  currentState: GAME_STATE.FirstCardAwaits,

  // 初始渲染
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52));
  },

  // 依據遊戲狀態，做不同行為
  dispatchCardAction(card) {
    // 點擊打開後的卡片 不作用
    if (!card.classList.contains("back")) {
      return;
    }
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card);
        model.revealedCards.push(card);
        this.currentState = GAME_STATE.SecondCardAwaits;
        break;

      case GAME_STATE.SecondCardAwaits:
        // 次數+1
        view.renderCount(++model.count);
        view.flipCards(card);
        model.revealedCards.push(card);

        if (model.isRevealedCardsMatched()) {
          // 成功
          this.currentState = GAME_STATE.CardsMatched;
          // 加分
          view.renderScore((model.score += 1));
          // 新增樣式
          view.pairCard(...model.revealedCards);
          // 初始遊戲
          model.revealedCards = [];
          // 遊戲結束
          if (model.score === 3) {
            console.log("showGameFinished");
            this.currentState = GAME_STATE.GameFinished;
            view.showGameFinished(true);
            return;
          }

          this.currentState = GAME_STATE.FirstCardAwaits;
        } else {
          // fail
          this.currentState = GAME_STATE.CardsMatchFailed;
          // 特效
          view.appendWrongAnimation(...model.revealedCards);
          // 一秒後...
          setTimeout(this.resetCards, 1000);
        }
        break;
    }
    console.log("現在狀態", this.currentState);
    console.log(
      "打開的卡片",
      model.revealedCards.map((c) => c.dataset.index)
    );
  },

  // 翻牌一秒後...
  resetCards() {
    // 蓋牌
    // spread ：把[x, y]打開丟進參數(x, y)
    view.flipCards(...model.revealedCards);
    // 清空卡匣
    model.revealedCards = [];
    // 回到初始狀態
    controller.currentState = GAME_STATE.FirstCardAwaits;
    // why not this.currentState
    // 因為resetCard現在是 setTimeout在呼叫他，又setTimesout是瀏覽器的預設method，因此此時this指向瀏覽器
  },
};

// --------------資料---------------
const model = {
  revealedCards: [],
  isRevealedCardsMatched() {
    // 去判斷打開兩張卡是否一樣
    return (
      this.revealedCards[0].dataset.index % 13 ===
      this.revealedCards[1].dataset.index % 13
    );
  },

  score: 0,
  count: 0,
};

// 洗牌
const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys()); // 正常排序的陣列
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1));
      [number[index], number[randomIndex]] = [
        number[randomIndex],
        number[index],
      ];
    }
    return number;
  },
};
controller.generateCards();

// 翻牌
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", (e) => {
    console.log(card);
    controller.dispatchCardAction(card);
  });
});
