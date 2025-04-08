const gameContainer = document.getElementById("minesweeper");
const previewContainer = document.getElementById("preview");
const playTimerContainer = document.getElementById("play-time");
const endMessageContainer = document.getElementById("end-message");
const gameEndOverayContainer = document.getElementById("gameOverOverlay");
const restartBtnContainer = document.getElementById("restart");
const columns = document.getElementsByClassName("column");

let GAME_WIDTH = 0;
let GAME_HEIGHT = 0;

let timeCount = 0;
let timerId = null;

let gameStatus = GAME_STATUS.READY;
//시간체크
function timerStart() {
  if (timerId) {
    clearInterval(timerId);
  }
  timeCount = 0;
  timerId = setInterval(() => {
    playTimerContainer.innerHTML = `플레이 시간: ${++timeCount}초`;
  }, 1000);
}
//맵초기화
function createMap(rows, columns, mineCount) {
  const map = Array.from({ length: rows }, () => Array(columns).fill(MAP_S));
  for (let i = 0; i < mineCount; i++) {
    let row, column;
    do {
      row = Math.floor(Math.random() * rows);
      column = Math.floor(Math.random() * columns);
    } while (map[row][column] === MAP_M);
    map[row][column] = MAP_M;
  }
  return map;
}
//게임판 배치
function initGame(width, height, mineCount) {
  MINE_MAP = createMap(height, width, mineCount);
  SEARCH_MAP = Array.from({ length: height }, () =>
    Array(width).fill(NO_SEARCH)
  );
  FLAG_MAP = Array.from({ length: height }, () => Array(width).fill(UN_FLAG));

  let temp = `
    <ul>
  `;
  for (let i = 0; i < MINE_MAP.length; ++i) {
    temp += `
      <li class="row" style="width: ${width * 30}px;">
        <ul>
    `;
    for (let j = 0; j < MINE_MAP[i].length; ++j) {
      temp += `<li class="column" data-row=${i} data-column=${j}></li>`;
    }
    temp += `
      </li>
    </ul>
  `;
  }
  temp += `</ul>`;
  gameContainer.innerHTML = temp;
  timerStart();
}
//클릭이벤트
function clickEventHandler(e) {
  const { row, column } = this.dataset;
  const parseRow = parseInt(row);
  const parseColumn = parseInt(column);
  if (gameStatus !== GAME_STATUS.PLAY) return;
  if (parseRow < 0 || column < 0) return;
  if (parseRow >= MINE_MAP.length || parseColumn >= MINE_MAP[0].length) return;
  if (FLAG_MAP[parseRow][parseColumn]) return;
  if (MINE_MAP[parseRow][parseColumn]) {
    gameStatus = GAME_STATUS.END;
    timerId && clearInterval(timerId);
    showMine();
    failGame();
    return;
  }
  open(parseRow, parseColumn);
  render();
}
//좌클릭
function open(row, column) {
  if (SEARCH_MAP[row][column]) return;

  const { aroundPositions, aroundMines } = getAroundInfo(row, column);
  if (aroundMines.every((m) => !m)) {
    SEARCH_MAP[row][column] = DISABLE;
    FLAG_MAP[row][column] = UN_FLAG;
    aroundPositions.forEach((position) => open(position[0], position[1]));
  } else {
    SEARCH_MAP[row][column] = NEAR_MINE;
    FLAG_MAP[row][column] = UN_FLAG;
  }
}

function render() {
  let flagCount = 0;
  for (let i = 0; i < MINE_MAP.length; ++i) {
    for (let j = 0; j < MINE_MAP[i].length; ++j) {
      const target = columns[i * MINE_MAP.length + j];
      if (SEARCH_MAP[i][j]) {
        target.classList.remove("flag");
        target.classList.add(
          SEARCH_MAP[i][j] === DISABLE ? "open-disable" : "open-near-mine"
        );
        if (SEARCH_MAP[i][j] === NEAR_MINE) {
          const { aroundMines } = getAroundInfo(i, j);
          target.innerText = aroundMines.reduce(
            (acc, curVal) => acc + curVal,
            0
          );
        }
      } else if (FLAG_MAP[i][j]) {
        target.classList.add("flag");
        flagCount++;
      }
    }
  }
  document.getElementById(
    "flag-count-text"
  ).innerText = `깃발 갯수: ${flagCount}`;
}
//우클릭
function rightClickEventHandler(e) {
  e.preventDefault();
  if (gameStatus !== GAME_STATUS.PLAY) return;
  const { row, column } = this.dataset;
  if (SEARCH_MAP[row][column]) return;
  if (FLAG_MAP[row][column] === FLAG) {
    FLAG_MAP[row][column] = UN_FLAG;
    this.classList.remove("flag");
  } else if (FLAG_MAP[row][column] === UN_FLAG) {
    FLAG_MAP[row][column] = FLAG;
    this.classList.add("flag");
  }
  render();
  if (checkMine()) {
    timerId && clearInterval(timerId);
    gameStatus = GAME_STATUS.END;
    completeGame();
  }
}
//지뢰보기
function showMine() {
  for (let i = 0; i < MINE_MAP.length; ++i) {
    for (let j = 0; j < MINE_MAP[i].length; ++j) {
      if (MINE_MAP[i][j] === MAP_M) {
        columns[i * MINE_MAP.length + j].classList.add("mine");
      }
    }
  }
}
//지뢰확인
function checkMine() {
  for (let i = 0; i < MINE_MAP.length; ++i) {
    for (let j = 0; j < MINE_MAP[i].length; ++j) {
      if (MINE_MAP[i][j] !== MAP_M) {
        continue;
      }
      if (!(MINE_MAP[i][j] === MAP_M && FLAG_MAP[i][j] === FLAG)) {
        return false;
      }
    }
  }

  return true;
}

function getAroundInfo(row, column) {
  const aroundPositions = [
    [row - 1, column - 1],
    [row - 1, column],
    [row - 1, column + 1],
    [row, column - 1],
    [row, column + 1],
    [row + 1, column - 1],
    [row + 1, column],
    [row + 1, column + 1],
  ].filter(
    (pos) =>
      pos[0] > -1 && pos[0] < GAME_WIDTH && pos[1] > -1 && pos[1] < GAME_HEIGHT
  );
  const aroundMines = aroundPositions.map((pos) => MINE_MAP[pos[0]][pos[1]]);

  return {
    aroundPositions,
    aroundMines,
  };
}
//재시작
restartBtnContainer.addEventListener("click", () => {
  start();
});
//시작 버튼
document.getElementById("submit").addEventListener("click", () => {
  start();
});
//게임 초기 설정
function start() {
  gameEndOverayContainer.style.display = "none";
  GAME_WIDTH = parseInt(document.getElementById("size").value) || 10;
  GAME_HEIGHT = GAME_WIDTH;
  const mineCount = parseInt(document.getElementById("mine-count").value) || 15;
  const isValid = validation(GAME_WIDTH, GAME_HEIGHT, mineCount);
  if (isValid) {
    return;
  }
  document.getElementById(
    "mine-count-text"
  ).innerText = `전체 지뢰 갯수: ${mineCount}`;
  initGame(GAME_WIDTH, GAME_HEIGHT, mineCount);
  for (let i = 0; i < MINE_MAP.length * MINE_MAP[0].length; ++i) {
    columns[i].addEventListener("click", clickEventHandler);
    columns[i].addEventListener("contextmenu", rightClickEventHandler);
  }
  gameStatus = GAME_STATUS.PLAY;
  if (previewContainer.innerHTML.trim()) {
    previewRender();
  }
}
//게임판 설정
function validation(width, height, mineCount) {
  //게임 최소값
  if (width < 2) {
    alert("게임 사이즈는 최소 2입니다.");
    return true;
  }
  //게임판 최대값
  if (width > 10) {
    alert("게임 사이즈는 최대 10입니다.");
    return true;
  }
  //지뢰 최소값
  if (mineCount < 1) {
    alert("지뢰는 최소 1개여야 합니다.");
    return true;
  }
  //지뢰 최대값
  if (width * height < mineCount) {
    alert("게임 크기보다 지뢰가 많으면 안됩니다.");
    return true;
  }
  return false;
}
//게임 오버
function failGame() {
  gameEndOverayContainer.style.display = "flex";
  endMessageContainer.innerText = "지뢰를 밟았습니다.";
}
//게임 클리어
function completeGame() {
  gameEndOverayContainer.style.display = "flex";
  endMessageContainer.innerText = "모든 지뢰를 찾았습니다.";
}
