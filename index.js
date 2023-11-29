//这段代码是一个Node.js脚本，用于通过蓝牙连接与控制"Shining" LED面具

var noble = require('@abandonware/noble');
const textEffects = require('./codes').textEffects;

const readline = require('readline');  //从命令行获取用户输入
const rl = readline.createInterface({  //创建了一个readline接口，用于从控制台读取用户输入
  input: process.stdin,
  output: process.stdout,
});

let connected = false;
//当蓝牙状态发生变化时，触发此事件处理函数。
//在状态变为 'poweredOn' 时，开始扫描周围的蓝牙设备。
noble.on('stateChange', async (state) => {
  console.log('state change', state);

  if (state === 'poweredOn') {
    console.log('scanning');
    await noble.startScanningAsync();
  }
});
//当发现蓝牙设备时，触发此事件处理函数。
//如果设备的localName为'MASK-02A711'且未连接（connected为false）
//停止扫描并尝试连接设备。连接成功后，发现服务和特征。
noble.on('discover', async (peripheral) => {

  const { localName } = peripheral.advertisement;

  if (localName != 'MASK-02A711' || connected) return;

  noble.stopScanning();

  console.log('Found Mask', localName);
  
  peripheral.connect(err => {
    peripheral.discoverAllServicesAndCharacteristics(async (err, services, characteristics) => {
      console.log(services, characteristics);

      await waitUserInput(characteristics);
      rl.close();
    })
  });  

});
//通过 readline 模块等待用户输入，当用户按下键盘上的键时，执行相应的操作。按下 'x' 键时，退出等待用户输入。否则，执行 changeTextEffect 函数，随机更改LED面具的文本效果。
function waitUserInput(characteristics) {
  return new Promise(resolve => rl.question('Press a key', async (ans) => {
    console.log(ans);
    
    if (ans == 'x') resolve();

    await changeTextEffect(characteristics);
    // await changeFace(characteristics);

    await waitUserInput(characteristics);
  }))
}
//从 textEffects 中随机选择一个效果，将其转换为十六进制并写入LED面具的特征（characteristics）
async function changeTextEffect(characteristics) {
  const i = Math.floor(Math.random() * textEffects.length);

  await new Promise((resolve, reject) => {
    characteristics[0].write(Buffer.from(removeSpaces(textEffects[i]), 'hex'), true, err => {
      if (err) reject(err);
      resolve();
    });
  });
}

async function changeFace(characteristics) {
  lightValues.forEach(async (value) => {
      await new Promise((resolve, reject) => {
        characteristics[0].write(Buffer.from(removeSpaces(value), 'hex'), true, err => {
          if (err) reject(err);
          console.log(value)
          resolve();
        });
      });
    });

    await new Promise((resolve, reject) => {
      characteristics[0].write(Buffer.from(removeSpaces(finalLightValue), 'hex'), true, err => {
        if (err) reject(err);
        console.log(finalLightValue)
        resolve();
      });
    });


    otherValues.forEach(async (value) => {
      await new Promise((resolve, reject) => {
        characteristics[0].write(Buffer.from(removeSpaces(value), 'hex'), true, err => {
          if (err) reject(err);
          console.log(value)
          resolve();
        });
      });
    });

    await new Promise((resolve, reject) => {
      characteristics[0].write(Buffer.from(removeSpaces(finalOtherValue), 'hex'), true, err => {
        if (err) reject(err);
        console.log(finalOtherValue)
        resolve();
      });
    });
}

function removeSpaces(str) {
  return str.replace(/\s/g, '');
}
//启动蓝牙扫描，这个函数目前似乎没有被调用
async function connect() {
  console.log('scanning');
  await noble.startScanningAsync();
}

async function disconnect() {
  if (connected) {
    await device.disconnectAsync();
    connected = false;
  }

  process.exit(0);
}
//当收到 SIGINT 信号（Ctrl+C）时，执行此函数，断开与设备的连接并退出进程
//catches ctrl+c event
process.on('SIGINT', disconnect.bind(null, {exit:true}));