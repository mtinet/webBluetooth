# 라즈베리파이 피코 W 블루투스 연결 웹페이지

웹 블루투스 API를 사용하여 라즈베리파이 피코 W와 블루투스 연결을 할 수 있는 웹페이지입니다.

## 기능

- 🔗 **블루투스 연결**: 라즈베리파이 피코 W와 블루투스 연결
- ❌ **연결 해제**: 블루투스 연결 해제
- 📊 **실시간 상태 표시**: 연결 상태를 시각적으로 표시
- 📝 **연결 로그**: 모든 연결 과정을 실시간으로 로그에 기록
- 📱 **반응형 디자인**: 모바일과 데스크톱에서 모두 사용 가능

## 사용법

### 1. 웹페이지 실행

웹 블루투스 API는 HTTPS 환경에서만 작동하므로, 다음 중 하나의 방법으로 실행하세요:

#### 방법 1: 로컬 서버 실행 (권장)

```bash
# Python 3가 설치되어 있다면
python -m http.server 8000

# 또는 Node.js가 설치되어 있다면
npx http-server -p 8000
```

그 후 브라우저에서 `https://localhost:8000`으로 접속하세요.

#### 방법 2: Live Server (VS Code)

VS Code에서 Live Server 확장을 설치하고 `index.html`을 우클릭하여 "Open with Live Server"를 선택하세요.

### 2. 블루투스 연결

1. **블루투스 연결** 버튼을 클릭합니다.
2. 브라우저에서 블루투스 장치 선택 창이 나타납니다.
3. 라즈베리파이 피코 W 장치를 선택합니다.
4. 연결이 완료되면 상태 표시가 녹색으로 변경됩니다.

### 3. 연결 해제

**연결 해제** 버튼을 클릭하여 블루투스 연결을 해제할 수 있습니다.

## 라즈베리파이 피코 W 설정

피코 W에서 블루투스 기능을 사용하려면 다음 MicroPython 코드를 실행해야 합니다:

```python
import bluetooth
from micropython import const
import struct

# 블루투스 서비스 UUID
_IRQ_CENTRAL_CONNECT = const(1)
_IRQ_CENTRAL_DISCONNECT = const(2)
_IRQ_GATTS_WRITE = const(3)

# 서비스 UUID
_SERVICE_UUID = bluetooth.UUID(0x1800)  # Generic Access
_CHAR_UUID = bluetooth.UUID(0x2A00)     # Device Name

# 블루투스 초기화
ble = bluetooth.BLE()
ble.active(True)

# GATT 서버 설정
def bt_irq(event, data):
    if event == _IRQ_CENTRAL_CONNECT:
        print("연결됨")
    elif event == _IRQ_CENTRAL_DISCONNECT:
        print("연결 해제됨")
    elif event == _IRQ_GATTS_WRITE:
        print("데이터 수신:", data)

ble.irq(bt_irq)

# 서비스 등록
services = (
    (
        _SERVICE_UUID,
        (
            (_CHAR_UUID, "Pico W"),
        ),
    ),
)

((handle,),) = ble.gatts_register_services(services)

print("블루투스 서비스가 시작되었습니다.")
```

## 파일 구조

```
aiCarV2/
├── index.html          # 메인 HTML 파일
├── style.css           # CSS 스타일 파일
├── script.js           # JavaScript 블루투스 로직
└── README.md           # 이 파일
```

## 브라우저 지원

웹 블루투스 API는 다음 브라우저에서 지원됩니다:

- ✅ Chrome 56+
- ✅ Edge 79+
- ✅ Opera 43+
- ❌ Firefox (지원하지 않음)
- ❌ Safari (지원하지 않음)

## 주의사항

1. **HTTPS 필수**: 웹 블루투스 API는 보안상 HTTPS 환경에서만 작동합니다.
2. **사용자 상호작용**: 블루투스 연결은 사용자가 버튼을 클릭하는 등의 상호작용이 있어야 합니다.
3. **권한 요청**: 브라우저에서 블루투스 권한을 요청할 수 있습니다.

## 문제 해결

### 블루투스가 검색되지 않는 경우

1. 피코 W의 블루투스가 활성화되어 있는지 확인
2. 다른 장치에서 피코 W가 보이는지 확인
3. 브라우저의 블루투스 권한을 확인

### 연결이 실패하는 경우

1. 피코 W가 다른 장치와 연결되어 있지 않은지 확인
2. 브라우저를 새로고침하고 다시 시도
3. 피코 W를 재부팅하고 다시 시도

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
