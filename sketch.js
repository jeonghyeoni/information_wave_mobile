let string = "Please enter a keyword ";
let intervalX = 15;
let intervalY = 40;
const noiseScale = 0.02; //wave speed
const fontSize = 18;
const playerSpeed = 2;
const playerSize = 10;
let pFrame = 0;
let userInput;
let keyword = '';
let searchButton;
let gameStarted = false;
let gameOver = false;
let screenSize = 320;
let joystickSize = 60;
let joyX = 0;
let joyY = 0;
let joystick;
let touched = false;
let replayButton;

function preload() {
  font = loadFont("assets/Pretendard-Regular.otf");
  tone = loadSound('assets/Tone.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  tone.setVolume(0.3);
  
  // replay 버튼 생성하고 숨겨 놓기
  replayButton = createButton('play again');
  replayButton.size(80);
  replayButton.position(width/2 - 40, height/2 + 100);
  replayButton.hide();
  
  // 화면 비율에 따라서 스크린 크기 설정 
  if (height < width) {
    screenSize = height / 2.5;
  } else {
    screenSize = width / 2.5;
  }

  // 사용자 입력을 받는 input 요소
  userInput = createInput();
  userInput.size(200);
  userInput.position(width/2 - 125, height/2 + screenSize);
  
  // search 버튼 생성
  const searchButton = createButton('Search');
  searchButton.position(width/2 + 75, height/2 + screenSize);
  
  // search 버튼을 누르면 
  searchButton.mousePressed(() => {
    keyword = userInput.value(); // 유저가 입력한 값을 keyword에 저장하고 
    gameStarted = false; // game 일시 정지 (gameStarted == true 일 때만 글자가 파도침)
    
    if(isAlnum(keyword)){ //keyword가 영어일 경우
      intervalX = 15; // 자간 설정
      fetchWikipediaContent(keyword)  // wikipedia에서 keyword를 검색한 결과가 Promise 객체로 반환 됨
      .then(content => {
        string = content; // Promise의 결과 값을 string 변수에 할당
        if(!string){ // string == undefined인 경우 대체 텍스트를 넣어줌
          string = "Search results do not exist. Please enter another keyword.";
        }
        wave = new Wave(keyword, string, intervalX, intervalY, noiseScale, fontSize); // 새로워진 string으로 새 wave 생성
      })
      .catch(error => {
        console.error('Error:', error);
      });
    } 
    else{ //keyword가 한국어일 경우
      intervalX = 20; // 자간 설정
      fetchWikipediaContentKorean(keyword) // 한국어 wikipedia에서 keyword를 검색한 결과가 Promise 객체로 반환 됨
      .then(content => {
        string = content; // Promise의 결과 값을 string 변수에 할당
        if(!string){ // string == undefined인 경우 대체 텍스트를 넣어줌
          string = "Search results do not exist. Please enter another keyword.";
        }
        wave = new Wave(keyword, string, intervalX, intervalY, noiseScale, fontSize);  // 새로워진 string으로 새 wave 생성
      })
      .catch(error => {
        console.error('Error:', error);
      });                    
    }
  }); /* searchButton Pressed */
  
  // 조이스틱 위치 설정
  joyX = width - joystickSize - 40;
  joyY = height - joystickSize - 20;

  // 초기 객체들 생성
  player = new Player(width / 2, height/2 + screenSize - playerSize, playerSize, playerSize, playerSpeed);
  wave = new Wave(keyword, string, intervalX, intervalY, noiseScale, fontSize);
  joystick = new Joystick(joyX, joyY, joystickSize, player);
  score = new Score(width/2 - screenSize, height/2 - screenSize - 35, width/2 + screenSize, height/2 - screenSize - 35);  
  life = new Life(0, 0, width, 8);
  
  background(0);
  textFont(font);
  textAlign(LEFT, TOP);
  textSize(fontSize);
}

function draw() {
  background(0);
  fill(0);
  stroke(255);
  strokeWeight(1);
  
  rectMode(CENTER);
  rect(width / 2, height / 2, screenSize * 2, screenSize * 2); // screen 경계
  
  wave.show();
  
  fill(0, 255, 255); // player 색깔
  if(gameStarted){
  player.collision(wave, score, life);
  }
  player.restriction();
  player.show();
  
  joystick.show();
  score.update();
  score.show();
  life.show();
  
  if(touched){ //화면 터치 됐으면 조이스틱 값에 따라 player위치 조정 
    player.updateByJoystick();
  }
  gameOverCheck(life, score);
}

/*---------------------------------------------------------------------*/

class Player {
  constructor(x, y, w, h, v) {
    this.pos = createVector(x, y);
    this.w = w;
    this.h = h;
    this.o_v = v; //original velocity (글자와 충돌 시 debuff 후 속도 원상복귀를 위해)
    this.v = v;
    this.moveAngle = 0;
    this.joyPosX = 0;
    this.joyPosY = 0;
  }

  show() {
    noStroke();
    rect(this.pos.x, this.pos.y, this.w, this.h);
  }

  updateByJoystick() { 
    translate(this.pos.x, this.pos.y);
    this.pos.rotate(this.moveAngle);
    this.pos.x += this.v;
    translate(this.pos.x, this.pos.y);
    this.pos.rotate(-this.moveAngle);
    translate(0, 0);
  }

  restriction() {  // screen 경계 밖을 나가지 못하도록
    if (this.pos.x - this.w / 2 < width / 2 - screenSize) {
      this.pos.x = width / 2 - screenSize + this.w / 2;
    } else if (this.pos.x + this.w / 2 > width / 2 + screenSize) {
      this.pos.x = width / 2 + screenSize - this.w / 2;
    }
    if (this.pos.y - this.h / 2 < height / 2 - screenSize) {
      this.pos.y = height / 2 - screenSize + this.h / 2;
    } else if (this.pos.y + this.h / 2 > height / 2 + screenSize) {
      this.pos.y = height / 2 + screenSize - this.h / 2;
    }
  }

  collision(other, scoreSystem, lifeSystem) {
    let n;
    let index;
    let damage = 0.05;

    for (let i = 0; i < other.arr.length; i++) {
      index = i % other.string.length;
      let bound = font.textBounds(other.string[index], other.arr[i].x, other.arr[i].y, other.size);

      if (bound.x <= this.pos.x + this.w && this.pos.x + this.w <= bound.x + bound.w) {
        if (bound.y <= this.pos.y && this.pos.y <= bound.y + bound.h) {
         pFrame = frameCount; // 충돌 순간의 frameCount 저장
          lifeSystem.health -= damage; // 체력 감소
          if(other.targets.includes(other.arr[i])){ // wave의 targets 배열에 충돌한 글자가 있고
            if(!other.removed.includes(other.arr[i])){ // wave의 removed 배열에 충돌한 글자가 없으면
              tone.play(); // 소리 재생
              other.removed.push(other.arr[i]); // removed 배열에 충돌한 글자 추가
              scoreSystem.currentScore++;  // 점수 +1
            }
          }
          else{ // wave의 targets 배열에 충돌한 글자가 없으면 디버프
            this.debuff(bound, other);
          }
        } else if (bound.y <= this.pos.y + this.h && this.pos.y + this.h <= bound.y + bound.h) {
         pFrame = frameCount;
          lifeSystem.health -= damage;
          if(other.targets.includes(other.arr[i])){
            if(!other.removed.includes(other.arr[i])){
              tone.play();
              other.removed.push(other.arr[i]);
              scoreSystem.currentScore++;
            }
          }
          else{
            this.debuff(bound, other);
          }
        }
      } else if (this.pos.x <= bound.x + bound.w && this.pos.x >= bound.x) {
        if (this.pos.y <= bound.y + bound.h && this.pos.y >= bound.y) {
          pFrame = frameCount;
          lifeSystem.health -= damage;
          if(other.targets.includes(other.arr[i])){
            if(!other.removed.includes(other.arr[i])){
              tone.play();
              other.removed.push(other.arr[i]);
              scoreSystem.currentScore++;
            }
          }
          else{
            this.debuff(bound, other);
          }
        } else if (this.pos.y + this.h >= bound.y && this.pos.y + this.h <= bound.y + bound.h) {
          pFrame = frameCount;
          lifeSystem.health -= damage;
          if(other.targets.includes(other.arr[i])){
            if(!other.removed.includes(other.arr[i])){
              tone.play();
              other.removed.push(other.arr[i]);
              scoreSystem.currentScore++;
            }
          }
          else{
            this.debuff(bound, other);
          }
        }
      } else if (frameCount - pFrame >= 0.2 * deltaTime) { // 현재 충돌하지 않았고, 충돌 시점으로부터 0.2초 이상 지났으면
        this.v = this.o_v; // 속도 원상복
      }
    }
  } /* collision */

  debuff(bound, other) {
    fill(255, 0, 0); // red
    this.v = 0; // 유저가 player를 control하지 못하게 됨
    // 충돌한 글자의 흐름에 합류
    let n = noise(
      bound.x * other.velocity + millis() / 1000,
      bound.y * other.velocity + millis() / 1000,
      frameCount * noiseScale * noiseScale
    );
    let a = TAU * n;
    this.pos.x += cos(a);
    this.pos.y += sin(a) + sin(0.02 * this.pos.x + millis() / 300);
  }
} /* Player */

/*---------------------------------------------------------------------*/
class Life{
  constructor(x, y, w, h){
    this.health = 100;
    this.x = x;
    this.y = y; 
    this.w = w;
    this.h = h;
  }
  
  show(){
    rectMode(CORNER);
    noStroke();
    fill('green');
    rect(this.x, this.y, this.health/100 * this.w, this.h);
  }
}

/*---------------------------------------------------------------------*/

class Wave {
  constructor(keyword, string, intervalX, intervalY, velocity, fontSize) {
    this.keyword = keyword;
    this.string = string;
    this.intervalX = intervalX;
    this.intervalY = intervalY;
    this.velocity = velocity; 
    this.size = fontSize;
    this.arr = [];
    this.wordOrder = [];
    this.targets = [];
    this.removed = [];
    
    for (let j = height / 2 - screenSize; j < height / 2 + screenSize; j += this.intervalY) {
      for (let i = width / 2 - screenSize; i < width / 2 + screenSize; i += this.intervalX) {
        this.arr.push(createVector(i, j)); //screen 안에서 일정한 간격으로 벡터 생성
      }
    }
  }

 show(){
    let space = false;
    let target = false;
    let j, k;
    let index;
   
    this.targets = []; //targets 비우기
    
    strokeWeight(1);
    textSize(this.size);
    textAlign(LEFT, TOP);
    fill(255);
    
    for (let i = 0; i < this.arr.length; i++) {
      stroke(255);
      
      index = i % this.string.length; // string이 짧을 경우에도 화면 안에 글자를 가득 채우기 위함
      this.c = this.arr[i]; //this.arr[i]를 this.c로 치환
      
    
      // string에서 키워드와 일치하는 단어를 찾아 target화
      for(k = 0; k<this.keyword.length; k++){ //keyword의 길이 한 cycle
        if(this.string[index+k] == this.keyword[k] || this.string[index+k] == this.keyword[k].toUpperCase() || this.string[index+k] == this.keyword[k].toLowerCase()){
          target = true; // target일 경우 keyword와 일치하는 단어의 첫 글자만 target = true 값을 가지고 있음
        }
        else{
          target = false; // 한 cycle 안에서 한 번이라도 일치하지 않을 시 break
          break;
        }
      }
      
      // target일 시 단어를 targets 배열에 추가
      if(target){
        for(k = 0; k<this.keyword.length; k++){
          this.targets.push(this.arr[i+k]);
        }
      }
      
      // 현재 글자가 targets 안에 있고 제거 되지 않았으면 화면에 노란색으로 설정
      if(this.targets.includes(this.c) && !this.removed.includes(this.c)){
        fill('yellow');
      } else if(this.removed.includes(this.c)){ // targets 안에 있지만 제거 되었으면 투명으로 설정
        stroke(0, 0);
        fill(0, 0);
      } else{ // targets 안에 없으면 흰색으로 설정
        fill(255);
      }
      
      
      if(this.string[index] == ' ' || index == 0){ // 현재 글자가 공백이거나 string의 맨 앞 글자인 경우
        space = true;
        j = 0;
      } else{
        space = false;
        j++;
      }
      
      if(gameStarted){
        if(!space){ // 공백(or첫글자)이 아니면 공백 문자(or첫글자)의 흐름을 따라감
          this.update(this.arr[i-j].x , this.arr[i-j].y);
        } else{ // 공백(or첫글자)이면 자신 위치의 noise 흐름을 따라감
          this.update(this.c.x, this.c.y); 
        }
      }

      if(gameStarted){ // 글자가 화면 밖을 나갈 시 반대편에서 다시 나타나도록
        if (this.c.x < width/2 - screenSize) {
          this.c.x = width/2 + screenSize- this.size;
        } else if (this.c.x > width/2 + screenSize - this.size) {
          this.c.x = width/2 - screenSize;
        }
        if (this.c.y < height/2 - screenSize) {
          this.c.y = height/2 + screenSize - this.size;
        } else if (this.c.y > height/2 + screenSize - this.size) {
          this.c.y = height/2 - screenSize;
        }
      }
      
      // 화면에 글자 표시
      text(this.string[index], this.c.x, this.c.y);
    }
  } /* show */

  update(px, py) {
    let n = noise(
      px * this.velocity + millis() / 1000,
      py * this.velocity + millis() / 1000,
      frameCount * noiseScale * noiseScale
    );
    let a = TAU * n;
    this.c.x += cos(a);
    this.c.y += sin(a) + sin(0.02 * this.c.x + millis() / 300);  // 한 단어 안에서 글자가 물결 치도록 sin값을 추가로 더해줌
  }
}

/*---------------------------------------------------------------------*/

class Score{
  constructor(x, y, bx, by){
    this.currentScore = 0;
    this.bestScore = 0;
    this.x = x;
    this.y = y;
    this.bx = bx;
    this.by = by;
  }
  
  show(){
    textSize(30);
    strokeWeight(1);
    fill('white');
    stroke('white');
    textAlign(LEFT, TOP);
    text(`${this.currentScore}`, this.x, this.y);
    
    fill('red');
    stroke('red');
    textAlign(RIGHT, TOP);
    text(`${this.bestScore}`, this.bx, this.by);
  }
  
  update(){
    if(this.bestScore < this.currentScore){
      this.bestScore = this.currentScore;
    }
  }
}

/*---------------------------------------------------------------------*/

class Joystick {
  constructor(x, y, size, player) {
    this.centerX = x;
    this.centerY = y;
    this.posX = 0;
    this.posY = 0;
    this.player = player;
    this.size = size;
    player.joyPosX = x;
    player.joyPosY = y;
  }
  show() {
    // 배경 원
    stroke(152);
    strokeWeight(4);
    fill("#505050");
    ellipse(this.centerX, this.centerY, this.size * 2, this.size * 2);
    
    // stick
    push();
    translate(this.centerX, this.centerY);
    stroke("#303030");
    fill("#303030");
    ellipse(this.posX, this.posY, this.size, this.size);
    pop();
  }
  update() {
    let centerPoint = createVector(this.centerX, this.centerY);
    let fingerPos = createVector(touches[0].x, touches[0].y);
    let base = createVector(this.size, 0);
    
    // (조이스틱의 중심 -> 손가락의 위치)를 향하는 위치벡터 
    let stickPos = p5.Vector.sub(fingerPos, centerPoint);
    stickPos.limit(this.size); // stick이 배경 원 안을 벗어나지 못하도록

    // 실제 stick 위치 값 업데이트
    this.posX = stickPos.x;
    this.posY = stickPos.y;
  
    // stick 벡터의 길이를 0~플레이어 속도 값으로 맵핑 (player가 한 프레임 당 움직일 거리) 후 플레이어 속도에 대입
    let mappedDist = p5.Vector.dist(stickPos, createVector(0, 0));
    mappedDist = map(mappedDist, 0, this.size, 0, this.player.o_v);
    this.player.v = mappedDist;

    // 배경 원의 중심을 기준으로 손가락 위치(==strick 위치)의 각도 계산
    let angle = p5.Vector.angleBetween(stickPos, createVector(this.size, 0));
    this.player.moveAngle = angle;
  }
}
/*---------------------------------------------------------------------*/

function fetchWikipediaContent(keyword) { // 영어 위키
  return new Promise((resolve, reject) => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=9&exlimit=1&titles=${encodeURIComponent(
      keyword
    )}&explaintext=1&format=json&formatversion=2&origin=*`;
    
    // fetch()는 네트워크 요청을 비동기적으로 보내고 응답을 처리하는 기능을 제공하는 함수
    fetch(url)
      .then((response) => response.json()) // fetch 성공 시 반환된 값을 json으로 변환
      .then((data) => { // 변환 성공시 반환된 json을 data로 치환해 넣음
        const page = data.query.pages[0];
        const content = page.extract;
        console.log(content);
        resolve(content); // fetchWikipediaContent 함수가 content를 resolve하는 새로운 Promise 객체를 반환
      })
      .catch((error) => {
        console.error("Error:", error);
        reject(error);
      });
  });
}

function fetchWikipediaContentKorean(keyword){ // 한국어 위키
  return new Promise((resolve, reject) => {
    const url = `https://ko.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=9&exlimit=1&titles=${encodeURIComponent(keyword)}&explaintext=1&format=json&formatversion=2&origin=*`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        const page = data.query.pages[0];
        const content = page.extract;
        console.log(content);
        resolve(content);
      })
      .catch(error => {
        console.error('Error:', error);
        reject(error);
      });
  });
}

function isAlnum(word) {
  for (let i = 0; i < word.length; i++) {
    let charCode = word.charCodeAt(i);
    if ((charCode < 0x0041 || charCode > 0x005A) && // 대문자 A-Z 밖
        (charCode < 0x0061 || charCode > 0x007A) && // 소문자 a-z 밖
        (charCode < 0x0030 || charCode > 0x0039)) { // 숫자 0-9 밖
      return false; // 한 글자라도 영어/숫자가 아닐 시 false 반환
    }
  }
  return true; // 모두 영어/숫자이면 true 반환
}

function gameOverCheck(life, score){
  if(life.health <= 0){ //체력이 다 닳았을시
    touched = false; 
    gameOver = true; 
    gameStarted = false; // gameOver == true이므로 화면을 터치해도 touchMoved함수에서 gameStarted가 true로 업데이트 되지 않음 -> joystick이 업데이트 되지 않음
    textAlign(CENTER, CENTER);
    strokeWeight(40);
    stroke(0, 150);
    
    textSize(60);
    fill(255);
    text("GAME OVER", width/2, height/2 -35);
    
    textSize(20);
    strokeWeight(10);
    fill('red');
    text(`Score: ${score.currentScore}`, width/2, height/2 + 45);
    text(`Best Score: ${score.bestScore}`, width/2, height/2 + 75);
    
    // replay 버튼 보이기
    replayButton.show();
    
    //replay 버튼 누를 시 여러 변수들 초기화 후 gameOver = false -> joystick 다시 활성화
    replayButton.mousePressed(() => {
      life.health = 100;
      score.currentScore = 0;
      keyword = '';
      string = "Please enter a keyword ";
      wave = new Wave(keyword, string, intervalX, intervalY, noiseScale, fontSize);
      player = new Player(width/2, height - 20, playerSize, playerSize, playerSpeed);
      joystick = new Joystick(joyX, joyY, joystickSize, player);
      gameOver = false;
      replayButton.hide();
    });
  }
}

function touchMoved() {
  if(!gameOver){
  gameStarted = true;
  touched = true;
  }
  if(gameStarted){
  joystick.update();
  }
  return false;
}

function touchEnded() {
  touched = false;
  //터치가 끝나면 stick위치 초기화
  joystick.posX = 0;
  joystick.posY = 0;
}
