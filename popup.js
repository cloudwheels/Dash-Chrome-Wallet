function showLoading(el, show) {
  var element = document.getElementById(el);
  if (show) {
    element.style.display = "inline-block";
  } else {
    element.style.display = "none";
  }
}

function getLocalStorage(arrKeys) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(arrKeys, function (result) {
        resolve(result);
      });
    }
    catch (e) {
      chrome.extension.getBackgroundPage().console.log('Erroring  getting values for', key, 'from local storage');
      reject(e);
    }
  });
}


// on DOMContentLoaded

document.addEventListener('DOMContentLoaded', function () {


  let connectBtn = document.getElementById('connectBtn');
  let createBtn = document.getElementById('createBtn');
  let addressText = document.getElementById('addressText');
  let balanceText = document.getElementById('balanceText');
  let balanceBtn = document.getElementById('balanceBtn');
  let sendBtn = document.getElementById('sendBtn');
  let amountText = document.getElementById('amountText');
  let toAddressText = document.getElementById('toAddressText');
  let identityBtn = document.getElementById('identityBtn');
  let identityText = document.getElementById('identityText');
  let nameBtn = document.getElementById('nameBtn');
  let nameText = document.getElementById('nameText');
  let mnemonicText = document.getElementById('mnemonicText');
  let mnemonicBtn = document.getElementById('mnemonicBtn');

  let exampleQuerySelector = document.getElementById('exampleQuerySelector');
  let recordLocatorText = document.getElementById('recordLocatorText');
  let queryObjectText = document.getElementById('queryObjectText');
  let getDocumentsBtn = document.getElementById('getDocumentsBtn');

  let contractText = document.getElementById('contractText');
  let getContractBtn = document.getElementById('getContractBtn');


  // disable create button when address already created and stored
  chrome.storage.local.get('mnemonic', function (data) {
    if (data.mnemonic != '')
      createBtn.disabled = true;
    mnemonicText.value = data.mnemonic;
  });
  chrome.storage.local.get('address', function (data) {
    addressText.value = data.address;
  });
  chrome.storage.local.get('balance', function (data) {
    balanceText.value = data.balance;
  });
  chrome.storage.local.get('identity', function (data) {
    if (data.identity != '')
      identityBtn.disabled = true;
    identityText.value = data.identity;
  });
  chrome.storage.local.get('name', function (data) {
    if (data.name != '') {
      nameText.readOnly = true;
      nameBtn.disabled = true;
    }
    nameText.value = data.name;
  });


  // import not working for identities yet
  // mnemonicBtn.disabled = true;

  //connect
  connectBtn.addEventListener('click', function () {
    chrome.runtime.sendMessage({ greeting: "connect" }, function (response) {
      //check return response then send alert
      chrome.extension.getBackgroundPage().console.log("Response bg -> popup: " + response.complete);
    });
  }, false);


  //create wallet
  createBtn.addEventListener('click', function () {
    createBtn.disabled = true;
    showLoading('spinnerCreateWallet', true);
    chrome.runtime.sendMessage({ greeting: "createWallet" }, function (response) {
      if (response.complete) {
        getLocalStorage(['address', 'balance', 'mnemonic']).then((cookies) => {
          chrome.extension.getBackgroundPage().console.log("COOKIES:", JSON.stringify(cookies));
          chrome.extension.getBackgroundPage().console.log("Response bg -> popup: " + response.complete);
          addressText.value = cookies.address;
          balanceText.value = cookies.balance;
          mnemonicText.value = cookies.mnemonic;
          showLoading('spinnerCreateWallet', false);
        });
      }
      else {
        createBtn.disabled = false;
        showLoading('spinnerCreateWallet', false);
        alert('There was a problem creating the wallet - please try again')
      }
    });
  }, false);


  //refresh balance
  balanceBtn.addEventListener('click', function () {
    balanceBtn.disabled = true;
    showLoading('spinnerRefreshBalance', true);
    chrome.runtime.sendMessage({ greeting: "getBalance" }, function (response) {
      chrome.extension.getBackgroundPage().console.log("Response bg -> popup: " + response.complete);
      getLocalStorage(['balance']).then((cookies) => {
        balanceBtn.disabled = false;
        showLoading('spinnerRefreshBalance', false);
        balanceText.value = cookies.balance;
      });
    });
  }, false);


  //send funds
  sendBtn.addEventListener('click', function () {
    sendBtn.disabled = true;
    showLoading('spinnerSend', true);
    chrome.runtime.sendMessage({ greeting: "sendFunds", toAddress: toAddressText.value, amount: amountText.value }, function (response) {
      chrome.extension.getBackgroundPage().console.log("Response bg -> popup: " + response.complete);
      getLocalStorage(['balance']).then((cookies) => {
        sendBtn.disabled = false;
        showLoading('spinnerSend', false);
        balanceText.value = cookies.balance;
      });
    });
  }, false);


  //get documents
  getDocumentsBtn.addEventListener('click', function () {
    chrome.runtime.sendMessage({ greeting: "getDocuments", recordLocator: recordLocatorText.value, queryObject: queryObjectText.value }, function (response) {
      chrome.extension.getBackgroundPage().console.log("Response bg -> popup: " + response.complete);
      // queryObjectText.value = response.document;
    });
  }, false);


  //get contract
  getContractBtn.addEventListener('click', function () {
    getContractBtn.disabled = true;
    showLoading('spinnerGetContract', true);
    chrome.runtime.sendMessage({ greeting: "getContract", contractid: contractText.value }, function (response) {
      chrome.extension.getBackgroundPage().console.log("Response bg -> popup: " + response.complete);
      getContractBtn.disabled = false;
      showLoading('spinnerGetContract', false);
    });
  }, false);

  exampleQuerySelector.addEventListener("change", function () {
    if (exampleQuerySelector.value == "Example 1") {
      recordLocatorText.value = 'dpns.domain';
      queryObjectText.value = "{ where: [\n" +
        "['normalizedParentDomainName', '==', 'dash']\n" +
        "],\n" +
        "startAt: 0 }\n";
      contractText.value = '77w8Xqn25HwJhjodrHW133aXhjuTsTv9ozQaYpSHACE3';
      toAddressText.value = "yNPbcFfabtNmmxKdGwhHomdYfVs6gikbPf";  // Faucet
    }
  });


  //register identity
  identityBtn.addEventListener('click', function () {
    chrome.runtime.sendMessage({ greeting: "registerIdentity" }, function (response) {
      chrome.extension.getBackgroundPage().console.log("Response bg -> popup: " + response.complete);
      if (balanceText.value == '0') {
        alert('No funds detected!\nNeed to pay some fee to create identity.')
      }
      getLocalStorage(['identity']).then((cookies) => {
        identityText.value = cookies.identity;
      });
      identityBtn.disabled = true;
    });

  }, false);


  //register name
  nameBtn.addEventListener('click', function () {
    chrome.runtime.sendMessage({ greeting: "registerName", name: nameText.value }, function (response) {
      chrome.extension.getBackgroundPage().console.log("Response bg -> popup: " + response.complete);
      getLocalStorage(['name']).then((cookies) => {
        nameText.value = cookies.name;
      });
      nameText.readOnly = true;
      nameBtn.disabled = true;
    });

  }, false);


  mnemonicBtn.addEventListener('click', function () {
    chrome.runtime.sendMessage({ greeting: "importMnemonic", mnemonic: mnemonicText.value }, function (response) {
      chrome.extension.getBackgroundPage().console.log("Response bg -> popup: " + response.complete);
      getLocalStorage(['address', 'balance']).then((cookies) => {
        addressText.value = cookies.address;
        balanceText.value = cookies.balance;
      });
      // TODO: option 1 fire getBalance click event here
    });

  }, false);

}, false); // on DOMContentLoaded
