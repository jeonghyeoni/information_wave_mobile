let string = "Please enter a keyword ";
let intervalX = 0;
let intervalY = 0;
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
  replayButton = createButton('play again');
  replayButton.size(80);
  replayButton.position(width/2 - 40, height/2 + 100);
  replayButton.hide();
  
  if (height < width) {
    screenSize = height / 2.5;
  } else {
    screenSize = width / 2.5;
  }

  // 사용자 입력을 받는 input 요소
  userInput = createInput();
  userInput.size(200);
  userInput.position(width/2 - 125, height/2 + screenSize);
  
  // 버튼을 클릭하면 Wikipedia 내용을 가져와 콘솔에 출력
  const searchButton = createButton('Search');
  searchButton.position(width/2 + 75, height/2 + screenSize);
  searchButton.mousePressed(() => {
    keyword = userInput.value();
    gameStarted = false;
    if(isAlnum(keyword)){ //keyword가 영어일 경우
      intervalX = 15;
      fetchWikipediaContent(keyword)
      .then(content => {
        string = content; // Promise의 결과 값을 string 변수에 할당
        if(!string){
          string = "Search results do not exist. Please enter another keyword.";
        }
        wave = new Wave(keyword, string, intervalX, intervalY, noiseScale, fontSize);
      })
      .catch(error => {
        console.error('Error:', error);
      });
    } 
    else{ //keyword가 한국어일 경우
      intervalX = 20;
      fetchWikipediaContentKorean(keyword)
      .then(content => {
        string = content; // Promise의 결과 값을 string 변수에 할당
        if(!string){
          string = "Search results do not exist. Please enter another keyword.";
        }
        wave = new Wave(keyword, string, intervalX, intervalY, noiseScale, fontSize);
      })
      .catch(error => {
        console.error('Error:', error);
      });                    
    }
  }); /*searchButton Pressed*/
  intervalX = 15;
  intervalY = 40;
  joyX = width - joystickSize - 40;
  joyY = height - joystickSize - 20;

  rectMode(CENTER);
  player = new Player(width / 2, height/2 + screenSize - playerSize, playerSize, playerSize, playerSpeed);
  wave = new Wave(keyword, string, intervalX, intervalY, noiseScale, fontSize);
  joystick = new Joystick(joyX, joyY, joystickSize, player);
  score = new Score(width/2 - screenSize, height/2 - screenSize - 35, width/2 + screenSize, height/2 - screenSize - 35);  
  life = new Life(0, 0, width, 8);
  
  background(0);
  textFont(font);
  textAlign(LEFT, TOP);
  textSize(fontSize);
  //noLoop();
}

function draw() {
  background(0);
  fill(0);
  stroke(255);
  strokeWeight(1);
  
  rectMode(CENTER);
  rect(width / 2, height / 2, screenSize * 2, screenSize * 2);
  
  wave.show();
  
  fill(0, 255, 255);
  if(gameStarted){
  player.collision(wave, score, life);
  }
  player.restriction();
  player.show();
  
  joystick.show();
  score.update();
  score.show();
  life.show();
  
  if(touched){
    player.updateByJoystick();
  }
  gameOverCheck(life, score);
}

/*---------------------------------------------------------------------*/

class Player {
  constructor(x, y, w, h, v) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.o_v = v;
    this.v = v;
    this.collided = false;
    this.moveDist = 0;
    this.moveAngle = 0;
    this.joyPosX = 0;
    this.joyPosY = 0;
    this.pos = createVector(x, y);
  }

  show() {
    noStroke();
    rect(this.pos.x, this.pos.y, this.w, this.h);
  }

  updateByJoystick() {
    translate(this.pos.x, this.pos.y);
    this.pos.rotate(this.moveAngle);
    this.pos.x += this.moveDist;
    translate(this.pos.x, this.pos.y);
    this.pos.rotate(-this.moveAngle);
    translate(0, 0);
  }

  restriction() {
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
    let cutScale = 0.05;

    for (let i = 0; i < other.arr.length; i++) {
      index = i % other.string.length;
      let bound = font.textBounds(other.string[index], other.arr[i].x, other.arr[i].y, other.size);

      if (bound.x <= this.pos.x + this.w && this.pos.x + this.w <= bound.x + bound.w) {
        if (bound.y <= this.pos.y && this.pos.y <= bound.y + bound.h) {
         pFrame = frameCount;
          lifeSystem.health -= cutScale;
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
        } else if (bound.y <= this.pos.y + this.h && this.pos.y + this.h <= bound.y + bound.h) {
         pFrame = frameCount;
          lifeSystem.health -= cutScale;
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
          lifeSystem.health -= cutScale;
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
          lifeSystem.health -= cutScale;
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
      } else if (frameCount - pFrame >= 0.2 * deltaTime) {
        this.v = this.o_v;
      }
    } //forLoop end
  } //collision function end

  debuff(bound, other) {
    fill(255, 0, 0);
    this.v = 0;
    let n = noise(
      bound.x * other.velocity + millis() / 1000,
      bound.y * other.velocity + millis() / 1000,
      frameCount * noiseScale * noiseScale
    );
    let a = TAU * n;
    this.pos.x += cos(a);
    this.pos.y += sin(a) + sin(0.02 * this.pos.x + millis() / 300);
  }
}

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
    this.index = 0;
    this.targets = [];
    this.removed = [];
    
    for (
      let j = height / 2 - screenSize;
      j < height / 2 + screenSize;
      j += this.intervalY
    ) {
      for (
        let i = width / 2 - screenSize;
        i < width / 2 + screenSize;
        i += this.intervalX
      ) {
        this.arr.push(createVector(i, j));
      }
    }
  }

 show(){
    let space = false;
    let j, k;
    let target = false;
    this.targets = [];
    
    strokeWeight(1);
    textSize(this.size);
    textAlign(LEFT, TOP);
    fill(255);
    
    for (let i = 0; i < this.arr.length; i++) {
      stroke(255);
      
      this.index = i % this.string.length;
      this.c = this.arr[i];
      
      if(this.string[this.index] == ' ' || this.index == 0){
        space = true;
        j = 0;
      } else{
        space = false;
        j++;
      }
      
      this.bound = font.textBounds(this.string[this.index], this.c.x, this.c.y, this.size);
      
      for(k = 0; k<this.keyword.length; k++){
        if(this.string[this.index+k] == this.keyword[k] || this.string[this.index+k] == this.keyword[k].toUpperCase() || this.string[this.index+k] == this.keyword[k].toLowerCase()){
          target = true;
        }
        else{
          target = false;
          break;
        }
      }
      
      if(target){
        for(k = 0; k<this.keyword.length; k++){
          this.targets.push(this.arr[i+k]);
        }
      }
      
      if(this.targets.includes(this.c) && !this.removed.includes(this.c)){
        fill('yellow');
      } else if(this.removed.includes(this.c)){
        stroke(0, 0);
        fill(0, 0);
      } else{
        fill(255);
      }
      
      text(this.string[this.index], this.c.x, this.c.y);
      
      if(gameStarted){
        if(!space){
          this.update(this.arr[i-j].x , this.arr[i-j].y);
        } else{
          this.update(this.c.x, this.c.y);
        }
      }

      if(gameStarted){
        if (this.c.x < width/2 - screenSize) {
          this.c.x = width/2 + screenSize- this.size;
          //this.c.y = random(height);
        } else if (this.c.x > width/2 + screenSize - this.size) {
          this.c.x = width/2 - screenSize;
          //this.c.y = random(height);
        }
        if (this.c.y < height/2 - screenSize) {
          this.c.y = height/2 + screenSize - this.size;
          //this.c.x = random(width);
        } else if (this.c.y > height/2 + screenSize - this.size) {
          this.c.y = height/2 - screenSize;
          //this.c.x = random(width);
        }
      }
    }
  }

  update(px, py) {
    let n = noise(
      px * this.velocity + millis() / 1000,
      py * this.velocity + millis() / 1000,
      frameCount * noiseScale * noiseScale
    );
    let a = TAU * n;
    this.c.x += cos(a);
    this.c.y += sin(a) + sin(0.02 * this.c.x + millis() / 300);
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
    stroke(152);
    strokeWeight(4);
    fill("#505050");
    ellipse(this.centerX, this.centerY, this.size * 2, this.size * 2);

    push();
    translate(this.centerX, this.centerY);
    stroke("#303030");
    fill("#303030");
    ellipse(this.posX, this.posY, this.size, this.size);
    pop();
  }
  update() {
    gameStarted = true;
    let centerPoint = createVector(this.centerX, this.centerY);
    let fingerPos = createVector(touches[0].x, touches[0].y);
    let base = createVector(this.size, 0);
    let distance = p5.Vector.dist(fingerPos, centerPoint);
    
    let stickPos = p5.Vector.sub(fingerPos, centerPoint);
    stickPos.limit(this.size);
    //stickPos = p5.Vector.add(centerPoint, stickPos);

    this.posX = stickPos.x;
    this.posY = stickPos.y;

    let mappedDist = p5.Vector.dist(stickPos, createVector(0, 0));
    mappedDist = map(mappedDist, 0, this.size, 0, this.player.o_v);
    this.player.moveDist = mappedDist;

    let angle = p5.Vector.angleBetween(stickPos, createVector(this.size, 0));
    this.player.moveAngle = angle;
  }
}
/*---------------------------------------------------------------------*/

function fetchWikipediaContent(keyword) {
  return new Promise((resolve, reject) => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exsentences=9&exlimit=1&titles=${encodeURIComponent(
      keyword
    )}&explaintext=1&format=json&formatversion=2&origin=*`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const page = data.query.pages[0];
        const content = page.extract;
        console.log(content);
        resolve(content);
      })
      .catch((error) => {
        console.error("Error:", error);
        reject(error);
      });
  });
}

function fetchWikipediaContentKorean(keyword){
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

function isAlnum(text) {
  for (let i = 0; i < text.length; i++) {
    let charCode = text.charCodeAt(i);
    if ((charCode < 0x0041 || charCode > 0x005A) && // 대문자 A-Z
        (charCode < 0x0061 || charCode > 0x007A) && // 소문자 a-z
        (charCode < 0x0030 || charCode > 0x0039)) { // 숫자 0-9
      return false;
    }
  }
  return true;
}

function gameOverCheck(life, score){
  if(life.health <= 0){
    touched = false;
    gameOver = true;
    gameStarted = false;
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
    
    replayButton.show();
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
  joystick.posX = 0;
  joystick.posY = 0;
}
