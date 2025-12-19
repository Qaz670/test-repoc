// client.js - Клиент для игры Pixel Combats

class PixelCombatsClient {
    constructor(options = {}) {
        this.serverUrl = options.serverUrl || 'ws://localhost:3000';
        this.ws = null;
        this.playerId = null;
        this.gameState = null;
        this.players = new Map();
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
        
        // Конфигурация игры
        this.config = {
            canvasWidth: 800,
            canvasHeight: 600,
            tileSize: 32,
            playerSpeed: 5,
            maxHealth: 100,
            maxAmmo: 100
        };
        
        // Состояние игрока
        this.localPlayer = {
            id: null,
            x: 400,
            y: 300,
            health: 100,
            ammo: 100,
            direction: 'right',
            isShooting: false,
            lastShot: 0,
            shotCooldown: 200 // мс
        };
        
        this.eventListeners = new Map();
        this.isConnected = false;
        this.reconnectTimeout = null;
    }

    /**
     * Подключение к серверу
     */
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('Уже подключен к серверу');
            return;
        }

        console.log(`Подключение к серверу: ${this.serverUrl}`);
        
        try {
            this.ws = new WebSocket(this.serverUrl);
            
            this.ws.onopen = () => this.handleConnectionOpen();
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onclose = (event) => this.handleConnectionClose(event);
            this.ws.onerror = (error) => this.handleError(error);
            
        } catch (error) {
            console.error('Ошибка при создании WebSocket:', error);
            this.attemptReconnect();
        }
    }

    /**
     * Обработка успешного подключения
     */
    handleConnectionOpen() {
        console.log('Успешно подключено к серверу');
        this.isConnected = true;
        this.connectionAttempts = 0;
        
        // Отправляем информацию о новом игроке
        this.send('player_join', {
            x: this.localPlayer.x,
            y: this.localPlayer.y,
            health: this.localPlayer.health,
            ammo: this.localPlayer.ammo
        });
        
        this.triggerEvent('connected');
    }

    /**
     * Обработка входящих сообщений
     */
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            const { type, payload } = data;
            
            switch(type) {
                case 'player_id':
                    this.handlePlayerId(payload);
                    break;
                    
                case 'game_state':
                    this.handleGameState(payload);
                    break;
                    
                case 'player_joined':
                    this.handlePlayerJoined(payload);
                    break;
                    
                case 'player_left':
                    this.handlePlayerLeft(payload);
                    break;
                    
                case 'player_moved':
                    this.handlePlayerMoved(payload);
                    break;
                    
                case 'player_shot':
                    this.handlePlayerShot(payload);
                    break;
                    
                case 'player_hit':
                    this.handlePlayerHit(payload);
                    break;
                    
                case 'player_respawn':
                    this.handlePlayerRespawn(payload);
                    break;
                    
                case 'game_over':
                    this.handleGameOver(payload);
                    break;
                    
                case 'error':
                    this.handleServerError(payload);
                    break;
                    
                default:
                    console.warn('Неизвестный тип сообщения:', type);
            }
            
        } catch (error) {
            console.error('Ошибка при обработке сообщения:', error);
        }
    }

    /**
     * Получение ID игрока
     */
    handlePlayerId(payload) {
        this.playerId = payload.id;
        this.localPlayer.id = payload.id;
        console.log(`Получен ID игрока: ${this.playerId}`);
        
        this.triggerEvent('player_id', { id: this.playerId });
    }

    /**
     * Обновление состояния игры
     */
    handleGameState(payload) {
        this.gameState = payload;
        this.players = new Map(Object.entries(payload.players || {}));
        
        // Обновляем позицию локального игрока если есть новые данные
        if (this.playerId && this.players.has(this.playerId)) {
            const serverPlayer = this.players.get(this.playerId);
            this.localPlayer.x = serverPlayer.x;
            this.localPlayer.y = serverPlayer.y;
            this.localPlayer.health = serverPlayer.health;
            this.localPlayer.ammo = serverPlayer.ammo;
        }
        
        this.triggerEvent('game_state', this.gameState);
    }

    /**
     * Новый игрок подключился
     */
    handlePlayerJoined(payload) {
        const { id, player } = payload;
        this.players.set(id, player);
        
        this.triggerEvent('player_joined', { id, player });
    }

    /**
     * Игрок отключился
     */
    handlePlayerLeft(payload) {
        const { id } = payload;
        this.players.delete(id);
        
        this.triggerEvent('player_left', { id });
    }

    /**
     * Игрок переместился
     */
    handlePlayerMoved(payload) {
        const { id, x, y, direction } = payload;
        
        if (this.players.has(id)) {
            const player = this.players.get(id);
            player.x = x;
            player.y = y;
            if (direction) player.direction = direction;
        }
        
        this.triggerEvent('player_moved', payload);
    }

    /**
     * Игрок выстрелил
     */
    handlePlayerShot(payload) {
        const { id, x, y, direction, bulletId } = payload;
        
        this.triggerEvent('player_shot', {
            id,
            x,
            y,
            direction,
            bulletId
        });
    }

    /**
     * Игрок получил урон
     */
    handlePlayerHit(payload) {
        const { id, damage, newHealth, attackerId } = payload;
        
        if (this.players.has(id)) {
            const player = this.players.get(id);
            player.health = newHealth;
        }
        
        // Если это наш игрок
        if (id === this.playerId) {
            this.localPlayer.health = newHealth;
        }
        
        this.triggerEvent('player_hit', payload);
    }

    /**
     * Игрок возродился
     */
    handlePlayerRespawn(payload) {
        const { id, x, y, health, ammo } = payload;
        
        if (this.players.has(id)) {
            const player = this.players.get(id);
            player.x = x;
            player.y = y;
            player.health = health;
            player.ammo = ammo;
        }
        
        if (id === this.playerId) {
            this.localPlayer.x = x;
            this.localPlayer.y = y;
            this.localPlayer.health = health;
            this.localPlayer.ammo = ammo;
        }
        
        this.triggerEvent('player_respawn', payload);
    }

    /**
     * Конец игры
     */
    handleGameOver(payload) {
        this.triggerEvent('game_over', payload);
    }

    /**
     * Ошибка сервера
     */
    handleServerError(payload) {
        console.error('Ошибка сервера:', payload.message);
        this.triggerEvent('error', payload);
    }

    /**
     * Обработка закрытия соединения
     */
    handleConnectionClose(event) {
        console.log(`Соединение закрыто. Код: ${event.code}, Причина: ${event.reason}`);
        this.isConnected = false;
        
        this.triggerEvent('disconnected', {
            code: event.code,
            reason: event.reason
        });
        
        if (event.code !== 1000) { // Не нормальное закрытие
            this.attemptReconnect();
        }
    }

    /**
     * Обработка ошибок соединения
     */
    handleError(error) {
        console.error('WebSocket ошибка:', error);
        this.triggerEvent('connection_error', error);
    }

    /**
     * Попытка переподключения
     */
    attemptReconnect() {
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
            console.error('Достигнуто максимальное количество попыток подключения');
            this.triggerEvent('connection_failed');
            return;
        }
        
        this.connectionAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 30000);
        
        console.log(`Попытка переподключения ${this.connectionAttempts} через ${delay}мс`);
        
        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * Отправка сообщения на сервер
     */
    send(type, payload = {}) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('Нет подключения к серверу');
            return false;
        }
        
        try {
            const message = JSON.stringify({ type, payload });
            this.ws.send(message);
            return true;
        } catch (error) {
            console.error('Ошибка при отправке сообщения:', error);
            return false;
        }
    }

    /**
     * Отправка движения игрока
     */
    sendMovement(dx, dy, direction = null) {
        this.localPlayer.x += dx * this.config.playerSpeed;
        this.localPlayer.y += dy * this.config.playerSpeed;
        
        // Ограничение по границам
        this.localPlayer.x = Math.max(0, Math.min(this.config.canvasWidth, this.localPlayer.x));
        this.localPlayer.y = Math.max(0, Math.min(this.config.canvasHeight, this.localPlayer.y));
        
        if (direction) {
            this.localPlayer.direction = direction;
        }
        
        this.send('player_move', {
            x: this.localPlayer.x,
            y: this.localPlayer.y,
            direction: direction || this.localPlayer.direction
        });
    }

    /**
     * Отправка выстрела
     */
    sendShoot() {
        const now = Date.now();
        if (now - this.localPlayer.lastShot < this.localPlayer.shotCooldown) {
            return false; // Кулдаун
        }
        
        if (this.localPlayer.ammo <= 0) {
            this.triggerEvent('no_ammo');
            return false;
        }
        
        this.localPlayer.lastShot = now;
        this.localPlayer.ammo--;
        
        this.send('player_shoot', {
            x: this.localPlayer.x,
            y: this.localPlayer.y,
            direction: this.localPlayer.direction
        });
        
        return true;
    }

    /**
     * Запрос возрождения
     */
    sendRespawnRequest() {
        this.send('player_respawn_request');
    }

    /**
     * Подписка на события
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * Отписка от события
     */
    off(event, callback) {
        if (!this.eventListeners.has(event)) return;
        
        const listeners = this.eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    /**
     * Триггер события
     */
    triggerEvent(event, data = null) {
        if (!this.eventListeners.has(event)) return;
        
        this.eventListeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Ошибка в обработчике события ${event}:`, error);
            }
        });
    }

    /**
     * Получение состояния игры
     */
    getGameState() {
        return {
            players: Object.fromEntries(this.players),
            localPlayer: { ...this.localPlayer },
            config: { ...this.config }
        };
    }

    /**
     * Получение списка игроков
     */
    getPlayers() {
        return this.players;
    }

    /**
     * Получение локального игрока
     */
    getLocalPlayer() {
        return { ...this.localPlayer };
    }

    /**
     * Отключение от сервера
     */
    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        
        if (this.ws) {
            this.ws.close(1000, 'Пользователь отключился');
            this.ws = null;
        }
        
        this.isConnected = false;
        this.connectionAttempts = 0;
        
        console.log('Отключено от сервера');
    }

    /**
     * Проверка подключения
     */
    isConnectedToServer() {
        return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

// Экспорт для использования в браузере
if (typeof window !== 'undefined') {
    window.PixelCombatsClient = PixelCombatsClient;
}

// Экспорт для Node.js/ES модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PixelCombatsClient;
}
