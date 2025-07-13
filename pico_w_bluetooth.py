"""
라즈베리파이 피코 W 블루투스 서버
웹 블루투스 API와 통신하기 위한 MicroPython 코드
"""

import bluetooth
from micropython import const
import struct
import time

# 블루투스 이벤트 상수
_IRQ_CENTRAL_CONNECT = const(1)
_IRQ_CENTRAL_DISCONNECT = const(2)
_IRQ_GATTS_WRITE = const(3)
_IRQ_GATTS_READ_REQUEST = const(4)
_IRQ_SCAN_RESULT = const(5)
_IRQ_SCAN_DONE = const(6)
_IRQ_PERIPHERAL_CONNECT = const(7)
_IRQ_PERIPHERAL_DISCONNECT = const(8)
_IRQ_GATTC_SERVICE_RESULT = const(9)
_IRQ_GATTC_SERVICE_DONE = const(10)
_IRQ_GATTC_CHARACTERISTIC_RESULT = const(11)
_IRQ_GATTC_CHARACTERISTIC_DONE = const(12)
_IRQ_GATTC_DESCRIPTOR_RESULT = const(13)
_IRQ_GATTC_DESCRIPTOR_DONE = const(14)
_IRQ_GATTC_READ_RESULT = const(15)
_IRQ_GATTC_READ_DONE = const(16)
_IRQ_GATTC_WRITE_DONE = const(17)
_IRQ_GATTC_NOTIFY = const(18)
_IRQ_GATTC_INDICATE = const(19)

# 서비스 및 특성 UUID
_SERVICE_UUID = bluetooth.UUID(0x1800)  # Generic Access
_CHAR_UUID = bluetooth.UUID(0x2A00)     # Device Name
_CUSTOM_SERVICE_UUID = bluetooth.UUID('12345678-1234-1234-1234-123456789abc')
_CUSTOM_CHAR_UUID = bluetooth.UUID('87654321-4321-4321-4321-cba987654321')

class BluetoothServer:
    def __init__(self):
        self.ble = bluetooth.BLE()
        self.ble.active(True)
        self.ble.irq(self._irq)
        self._connections = set()
        self._rx_characteristic = None
        self._tx_characteristic = None
        self._connected = False
        self._write_callback = None
        
        # 서비스 등록
        self._register_services()
        
    def _irq(self, event, data):
        """블루투스 이벤트 처리"""
        if event == _IRQ_CENTRAL_CONNECT:
            conn_handle, _, _ = data
            self._connections.add(conn_handle)
            self._connected = True
            print(f"연결됨: {conn_handle}")
            
        elif event == _IRQ_CENTRAL_DISCONNECT:
            conn_handle, _, _ = data
            if conn_handle in self._connections:
                self._connections.remove(conn_handle)
            self._connected = False
            print(f"연결 해제됨: {conn_handle}")
            
        elif event == _IRQ_GATTS_WRITE:
            conn_handle, value_handle = data
            if conn_handle in self._connections:
                # 수신된 데이터 처리
                data_received = self.ble.gatts_read(value_handle)
                if data_received:
                    try:
                        message = data_received.decode('utf-8')
                        print(f"수신된 데이터: {message}")
                        
                        # 콜백 함수가 있으면 호출
                        if self._write_callback:
                            self._write_callback(message)
                            
                    except UnicodeDecodeError:
                        print(f"바이너리 데이터 수신: {data_received}")
                        
    def _register_services(self):
        """블루투스 서비스 등록"""
        # 기본 서비스 (Generic Access)
        services = (
            (
                _SERVICE_UUID,
                (
                    (_CHAR_UUID, "Pico W Bluetooth Server"),
                ),
            ),
            # 커스텀 서비스
            (
                _CUSTOM_SERVICE_UUID,
                (
                    (_CUSTOM_CHAR_UUID, self._rx_callback, self._tx_callback),
                ),
            ),
        )
        
        ((_, self._rx_characteristic, self._tx_characteristic),) = self.ble.gatts_register_services(services)
        
    def _rx_callback(self, data):
        """수신 콜백"""
        print(f"RX 콜백: {data}")
        
    def _tx_callback(self, data):
        """송신 콜백"""
        print(f"TX 콜백: {data}")
        
    def is_connected(self):
        """연결 상태 확인"""
        return self._connected
        
    def send_data(self, data):
        """데이터 전송"""
        if not self._connected:
            print("연결되지 않음")
            return False
            
        try:
            if isinstance(data, str):
                data = data.encode('utf-8')
            self.ble.gatts_notify(0, self._tx_characteristic, data)
            print(f"데이터 전송: {data}")
            return True
        except Exception as e:
            print(f"데이터 전송 실패: {e}")
            return False
            
    def set_write_callback(self, callback):
        """데이터 수신 콜백 설정"""
        self._write_callback = callback
        
    def get_connections(self):
        """연결된 클라이언트 수 반환"""
        return len(self._connections)

def main():
    """메인 함수"""
    print("라즈베리파이 피코 W 블루투스 서버 시작...")
    
    # 블루투스 서버 초기화
    ble_server = BluetoothServer()
    
    # 데이터 수신 콜백 설정
    def on_data_received(data):
        print(f"웹에서 수신된 데이터: {data}")
        # 에코 응답
        response = f"Echo: {data}"
        ble_server.send_data(response)
    
    ble_server.set_write_callback(on_data_received)
    
    print("블루투스 서버가 시작되었습니다.")
    print("웹 브라우저에서 연결을 시도하세요.")
    
    # 메인 루프
    while True:
        if ble_server.is_connected():
            # 연결된 상태에서 주기적으로 상태 출력
            print(f"연결된 클라이언트: {ble_server.get_connections()}")
            time.sleep(5)
        else:
            # 연결 대기 상태
            print("연결 대기 중...")
            time.sleep(2)

if __name__ == "__main__":
    main() 