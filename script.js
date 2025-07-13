class BluetoothManager {
    constructor() {
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.isConnected = false;
        
        this.initializeElements();
        this.bindEvents();
        this.checkBluetoothSupport();
    }

    initializeElements() {
        this.connectBtn = document.getElementById('connectBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');
        this.deviceInfo = document.getElementById('deviceInfo');
        this.deviceName = document.getElementById('deviceName');
        this.deviceId = document.getElementById('deviceId');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.logContainer = document.getElementById('logContainer');
        this.clearLogBtn = document.getElementById('clearLogBtn');
    }

    bindEvents() {
        this.connectBtn.addEventListener('click', () => this.connect());
        this.disconnectBtn.addEventListener('click', () => this.disconnect());
        this.clearLogBtn.addEventListener('click', () => this.clearLog());
    }

    checkBluetoothSupport() {
        if (!navigator.bluetooth) {
            this.log('웹 블루투스 API가 지원되지 않습니다. HTTPS 환경에서 실행해주세요.', 'error');
            this.connectBtn.disabled = true;
            return false;
        }
        this.log('웹 블루투스 API가 지원됩니다.', 'success');
        return true;
    }

    async connect() {
        try {
            this.log('블루투스 장치 검색을 시작합니다...', 'info');
            this.connectBtn.disabled = true;
            this.connectBtn.textContent = '검색 중...';

            // 블루투스 장치 요청
            this.device = await navigator.bluetooth.requestDevice({
                // 라즈베리파이 피코 W의 블루투스 서비스 UUID
                // 일반적인 BLE 서비스 UUID들
                acceptAllDevices: true,
                optionalServices: [
                    '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
                    '0000180a-0000-1000-8000-00805f9b34fb', // Device Information
                    '0000180d-0000-1000-8000-00805f9b34fb', // Health Thermometer
                    '00001812-0000-1000-8000-00805f9b34fb', // HID
                    '00001800-0000-1000-8000-00805f9b34fb', // Generic Access
                    '00001801-0000-1000-8000-00805f9b34fb'  // Generic Attribute
                ]
            });

            this.log(`장치 선택됨: ${this.device.name || '알 수 없는 장치'}`, 'success');

            // GATT 서버에 연결
            this.log('GATT 서버에 연결 중...', 'info');
            this.server = await this.device.gatt.connect();
            this.log('GATT 서버 연결 성공!', 'success');

            // 서비스 검색
            this.log('서비스 검색 중...', 'info');
            const services = await this.server.getPrimaryServices();
            this.log(`발견된 서비스 수: ${services.length}`, 'info');

            // 첫 번째 서비스 사용 (또는 특정 서비스)
            if (services.length > 0) {
                this.service = services[0];
                this.log(`서비스 선택됨: ${this.service.uuid}`, 'success');

                // 특성 검색
                const characteristics = await this.service.getCharacteristics();
                this.log(`발견된 특성 수: ${characteristics.length}`, 'info');

                if (characteristics.length > 0) {
                    this.characteristic = characteristics[0];
                    this.log(`특성 선택됨: ${this.characteristic.uuid}`, 'success');
                }
            }

            this.isConnected = true;
            this.updateUI();
            this.updateDeviceInfo();
            this.log('블루투스 연결이 완료되었습니다!', 'success');

        } catch (error) {
            this.log(`연결 실패: ${error.message}`, 'error');
            this.isConnected = false;
            this.updateUI();
        } finally {
            this.connectBtn.disabled = false;
            this.connectBtn.innerHTML = '<span class="btn-icon">🔗</span>블루투스 연결';
        }
    }

    async disconnect() {
        try {
            if (this.device && this.device.gatt.connected) {
                await this.device.gatt.disconnect();
                this.log('블루투스 연결이 해제되었습니다.', 'info');
            }
        } catch (error) {
            this.log(`연결 해제 중 오류: ${error.message}`, 'error');
        } finally {
            this.device = null;
            this.server = null;
            this.service = null;
            this.characteristic = null;
            this.isConnected = false;
            this.updateUI();
            this.hideDeviceInfo();
        }
    }

    updateUI() {
        if (this.isConnected) {
            this.statusDot.classList.add('connected');
            this.statusText.textContent = '연결됨';
            this.connectBtn.disabled = true;
            this.disconnectBtn.disabled = false;
        } else {
            this.statusDot.classList.remove('connected');
            this.statusText.textContent = '연결되지 않음';
            this.connectBtn.disabled = false;
            this.disconnectBtn.disabled = true;
        }
    }

    updateDeviceInfo() {
        if (this.device) {
            this.deviceName.textContent = this.device.name || '알 수 없는 장치';
            this.deviceId.textContent = this.device.id || '알 수 없음';
            this.connectionStatus.textContent = this.device.gatt.connected ? '연결됨' : '연결되지 않음';
            this.deviceInfo.style.display = 'block';
        }
    }

    hideDeviceInfo() {
        this.deviceInfo.style.display = 'none';
        this.deviceName.textContent = '-';
        this.deviceId.textContent = '-';
        this.connectionStatus.textContent = '-';
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        this.logContainer.appendChild(logEntry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }

    clearLog() {
        this.logContainer.innerHTML = '';
        this.log('로그가 지워졌습니다.', 'info');
    }

    // 데이터 전송 메서드 (필요시 사용)
    async sendData(data) {
        if (!this.isConnected || !this.characteristic) {
            this.log('연결되지 않은 상태에서는 데이터를 전송할 수 없습니다.', 'error');
            return;
        }

        try {
            const encoder = new TextEncoder();
            const dataArray = encoder.encode(data);
            await this.characteristic.writeValue(dataArray);
            this.log(`데이터 전송: ${data}`, 'success');
        } catch (error) {
            this.log(`데이터 전송 실패: ${error.message}`, 'error');
        }
    }

    // 데이터 수신 메서드 (필요시 사용)
    async startNotifications() {
        if (!this.isConnected || !this.characteristic) {
            this.log('연결되지 않은 상태에서는 알림을 받을 수 없습니다.', 'error');
            return;
        }

        try {
            await this.characteristic.startNotifications();
            this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
                const value = event.target.value;
                const decoder = new TextDecoder();
                const data = decoder.decode(value);
                this.log(`수신된 데이터: ${data}`, 'info');
            });
            this.log('알림 수신을 시작했습니다.', 'success');
        } catch (error) {
            this.log(`알림 시작 실패: ${error.message}`, 'error');
        }
    }
}

// 페이지 로드 시 블루투스 매니저 초기화
document.addEventListener('DOMContentLoaded', () => {
    const bluetoothManager = new BluetoothManager();
    
    // 전역 객체로 노출 (디버깅용)
    window.bluetoothManager = bluetoothManager;
}); 