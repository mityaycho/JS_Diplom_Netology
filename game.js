'use strict';

// Позволяет контролировать расположение объектов в двумерном
// пространстве и управляет их размером и перемещением.
class Vector {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}
	// Создает и возвращает новый объект типа Vector,
	// координаты которого будут суммой соответствующих координат суммируемых векторов.
	plus(vector) {
		if (!(vector instanceof Vector)) {
			throw new Error(`Можно прибавлять к вектору только вектор типа Vector`);
		}
		return new Vector(this.x + vector.x, this.y + vector.y);
	}
	// Создает и возвращает новый объект типа Vector, координаты которого будут равны
	// соответствующим координатам исходного вектора, умноженным на множитель.
	times(n = 1) {
		return new Vector(this.x * n, this.y * n);
	}
}
// контролирует все движущиеся объекты на игровом поле
// и контролирует их пересечение.
class Actor {
	constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
		if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
			throw new Error(`Расположение, размер и скорость должны быть объектом Vector`);
		}
		this.pos = pos;
		this.size = size;
		this.speed = speed;
	}
	get type() {
		return 'actor';
	}
	act() {

	}
	get left() {
		return this.pos.x;
	}
	get right() {
		return this.pos.x + this.size.x;
	}
	get top() {
		return this.pos.y;
	}
	get bottom() {
		return this.pos.y + this.size.y;
	}
	isIntersect(actor) {
		if (!(actor instanceof Actor) || (!actor)) {
			throw new Error(`Не является экземпляром Actor или не передано аргументов`);
		}
		// если равен самому себе
		if (actor === this) {
			return false;
		}
		return (
			this.right > actor.left &&
			this.left < actor.right &&
			this.top < actor.bottom &&
			this.bottom > actor.top
		);
	}
}

class Level {
	// принимает сетка игрового поля,
	// список движущихся объектов игрового поля
	constructor(grid = [], actors = []) {
		this.grid = grid.slice();
		this.actors = actors.slice();
		this.height = this.grid.length;
		this.width = this.grid.reduce((a, b) => {
			return b.length > a ? b.length : a;
		}, 0);
		// состояние прохождения уровня
		this.status = null;
		// таймаут после окончания игры
		this.finishDelay = 1;
		// движущийся объект
		this.player = this.actors.find(act => act.type === 'player');
	}
	// определяет, завершен ли уровень
	isFinished() {
		return this.status !== null && this.finishDelay < 0;
	}
	// расположен ли какой-то другой движущийся объект в переданной позиции
	actorAt(actor) {
		if (!(actor instanceof Actor) || (!actor)) {
			throw new Error(`Не является экземпляром Actor или не передано аргументов`);
		}
		// если переданный объект пересекается с обЪектом или объектами
		return this.actors.find(act => act.isIntersect(actor));
	}
	// Аналогично методу actorAt определяет, нет ли препятствия в указанном месте.
	// Также этот метод контролирует выход объекта за границы игрового поля.
	obstacleAt(pos, size) {
		if (!(pos instanceof Vector) && !(size instanceof Vector)) {
			throw new Error(`Не является экземпляром Vector или не передано аргументов`);
		}
		const left = Math.floor(pos.x);
		const right = Math.ceil(pos.x + size.x);
		const top = Math.floor(pos.y);
		const bottom = Math.ceil(pos.y + size.y);

		if (left < 0 || right > this.width || top < 0) {
			return 'wall';
		}
		if (bottom > this.height) {
			return 'lava';
		}
		for (let i = top; i < bottom; i++) {
			for (let k = left; k < right; k++) {
				const cross = this.grid[i][k];
				if (cross) {
					return cross;
				}
			}
		}
	}
	// Метод удаляет переданный объект с игрового поля.
	removeActor(actor) {
		this.actors = this.actors.filter(el => el !== actor);
	}
	// Определяет, остались ли еще объекты переданного типа на игровом поле.
	noMoreActors(type) {
		return !this.actors.some(el => el.type === type);
	}
	playerTouched(type, actor) {
		if (this.status !== null) {
			return;
		}
		if (type === 'lava' || type === 'fireball') {
			this.status = 'lost';
		}
		if (type === 'coin') {
			this.removeActor(actor);
			if (this.noMoreActors('coin')) {
				this.status = 'won';
			}
		}
	}
}
// позволяет создать игровое поле Level из массива строк
// принимает словарь
class LevelParser {
	constructor(map = {}) {
		this.map = map;
	}
	// Возвращает конструктор объекта по его символу, используя словарь. 
	actorFromSymbol(symbol) {
		return this.map[symbol];
	}
	// Возвращает строку, соответствующую символу препятствия.
	obstacleFromSymbol(symbol) {
		switch (symbol) {
			case 'x':
				return 'wall';
			case '!':
				return 'lava';
		}
	}
	// Принимает массив строк и преобразует его в массив массивов,
	// в ячейках которого хранится либо строка,
	// соответствующая препятствию, либо undefined.
	createGrid(plan) {
		return plan.map(el => el.split('')).map(el => el.map(el => this.obstacleFromSymbol(el)));
	}
	// Принимает массив строк и преобразует его в массив движущихся объектов,
	// используя для их создания конструкторы из словаря.
	/*
	createActors(plan) {
			const actors = [];
			plan.map((elemY, y) => {
					elemY.split('').map((elemX, x) => {
							const mapEl = this.map[elemX];
							if (typeof mapEl === 'function') {
									const res = new mapEl(new Vector(x, y));
									if (res instanceof Actor) {
											actors.push(res);
									}
							}
					})
			})
			return actors;
	}
	*/
	createActors(plan) {
		return plan.reduce((prev, elem, y) => {
			elem.split('').forEach((count, x) => {
				const func = this.actorFromSymbol(count);
				if (typeof func === 'function') {
					const actor = new func(new Vector(x, y));
					if (actor instanceof Actor) {
						prev.push(actor);
					}
				}
			});
			return prev;
		}, []);
	}

	// Принимает массив строк, создает и возвращает игровое поле,
	// заполненное препятствиями и движущимися объектами,
	// полученными на основе символов и словаря.
	parse(arr) {
		return new Level(this.createGrid(arr), this.createActors(arr));
	}
}
// станет прототипом для движущихся опасностей на игровом поле.
// Он должен наследовать весь функционал движущегося объекта Actor.
class Fireball extends Actor {
	constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
		super(pos, new Vector(1, 1), speed)
	}
	get type() {
		return 'fireball';
	}
	// Создает и возвращает вектор Vector следующей позиции шаровой молнии.
	getNextPosition(time = 1) {
		return this.pos.plus(this.speed.times(time));
	}
	handleObstacle() {
		this.speed = this.speed.times(-1);
	}
	// Обновляет состояние движущегося объекта.
	act(time, level) {
		const newPosition = this.getNextPosition(time);
		level.obstacleAt(newPosition, this.size) ? this.handleObstacle() : this.pos = newPosition;
	}
}
// Он будет представлять собой объект,
// который движется по горизонтали со скоростью 2
// и при столкновении с препятствием движется в обратную сторону.
class HorizontalFireball extends Fireball {
	constructor(pos = new Vector(0, 0)) {
		super(pos, new Vector(2, 0));
	}
}
// Он будет представлять собой объект,
// который движется по вертикали со скоростью 2
// и при столкновении с препятствием движется в обратную сторону.
class VerticalFireball extends Fireball {
	constructor(pos = new Vector(0, 0)) {
		super(pos, new Vector(0, 2));
	}
}
// Он будет представлять собой объект, который движется по вертикали
// со скоростью 3 и при столкновении с препятствием начинает движение
// в том же направлении из исходного положения, которое задано при создании.
class FireRain extends Fireball {
	constructor(pos = new Vector(0, 0)) {
		super(pos, new Vector(0, 3));
		this.startPos = pos;
	}
	handleObstacle() {
		this.pos = this.startPos;
	}
}
// реализует поведение монетки на игровом поле.
class Coin extends Actor {
	constructor(pos = new Vector(0, 0)) {
		super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
		this.spring = Math.random() * 2 * Math.PI;
		this.springSpeed = 8;
		this.springDist = 0.07;
		this.position = this.pos;
	}
	get type() {
		return 'coin';
	}
	// Обновляет текущую фазу spring, увеличив её на скорость springSpeed,
	// умноженную на время.
	updateSpring(time = 1) {
		this.spring = this.spring + this.springSpeed * time;
	}
	// Создает и возвращает вектор подпрыгивания.
	getSpringVector() {
		return new Vector(0, Math.sin(this.spring) * this.springDist);
	}
	// Создает и возвращает вектор новой позиции монетки.
	getNextPosition(time = 1) {
		this.updateSpring(time);
		return this.position.plus(this.getSpringVector());
	}
	// Получает новую позицию объекта и задает её как текущую.
	act(time) {
		this.pos = this.getNextPosition(time);
	}
}
// содержит базовый функционал движущегося объекта,
// который представляет игрока на игровом поле.
class Player extends Actor {
	constructor(pos = new Vector(0, 0)) {
		super(pos, new Vector(0.8, 1.5));
		this.pos = this.pos.plus(new Vector(0, -0.5));
	}
	get type() {
		return 'player';
	}
}

const actorDict = {
	'@': Player,
	'v': FireRain,
	'o': Coin,
	'=': HorizontalFireball,
	'|': VerticalFireball

};
const parser = new LevelParser(actorDict);

loadLevels()
	.then((res) => {
		runGame(JSON.parse(res), parser, DOMDisplay)
			.then(() => alert('Вы выиграли!'))
	});