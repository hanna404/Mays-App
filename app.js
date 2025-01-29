// app.js

var id="";
var user="";
var permission= "";
var permissionversion=5;

// check data
//$("#reportDeptLink").addClass("hiddenAdmin");
fetch('navbar.html')
.then(response => response.text())
.then(data => {
  document.getElementById('navbar').innerHTML = data;
  checkPermission();
})
.catch(error => console.error('Error loading navbar:', error));
function checkPermission () {

    permission= JSON.parse(localStorage.getItem("permission"));
     
if (permission==null || permission=="" || permission=="{}") {
    console.log("permission empty ");
    //console.log("permsiion change ");
    window.location.href="login.html";
  /*   permission = {
         version:1,
         sell:1,
         buy:1,
         reportBuy:0,
         reportSale:0,
         dailyReport:0,
         expense:0,        
         reportDept:1,
         out:0
     }*/
 
 }
 else {
    // alert(2);
     console.log("permissionnotempty ("+permission+")");
 }

 
if (permissionversion!=permission.version){
    
    console.log("permsiion change ");
    console.log(permission);
    console.log("permsiion version "+permission.version);
    window.location.href="login.html";
}
Object.keys(permission).forEach(key => {
 try {
   if(permission[key]==0){
    console.log("#"+key+"Link0");
   
    document.getElementById(key+"Link").classList.add("hiddenAdmin");
   }
   else {
    
    console.log("#"+key+"Link1"+permission.key);
    $("#"+key+"Link").removeClass("hiddenAdmin");
   }
}
catch (e){
    
}
});
}
function checkData () {
  
   id= localStorage.getItem("e");
   user= localStorage.getItem("user");
   
  
if (id===null){
    console.log("check data 2 ");
    window.location.href="login.html";
}
else {
   
} 
}

//

let db;

// Register the service worker for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
        .then(registration => {
            console.log('ServiceWorker registered with scope:', registration.scope);
        })
        .catch(err => {
            console.log('ServiceWorker registration failed:', err);
        });
    });

    navigator.serviceWorker.onmessage = function(event) {
        if (event.data.action === 'clearLocalStorage') {
          console.log('Clearing local storage as requested by the service worker.');
          localStorage.clear(); // Clear all local storage
          checkData();
        }
      };
}


// Open (or create) an IndexedDB database
function openDatabase() {
    const request = indexedDB.open('formDatabase', 1);

    request.onerror = function(event) {
        console.log('Error opening IndexedDB:', event);
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        console.log('IndexedDB opened successfully');
        checkForPendingRequests(); // Check for any unsent requests when the page loads
    };

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        db.createObjectStore('requests', { autoIncrement: true });
    };
}

// Add a request to IndexedDB
function saveRequest(data) {
    const transaction = db.transaction(['requests'], 'readwrite');
    const objectStore = transaction.objectStore('requests');
    objectStore.add(data);
    transaction.oncomplete = function() {
        console.log('Request saved to IndexedDB');
    };
    transaction.onerror = function(event) {
        console.log('Error saving request to IndexedDB:', event);
    };
}

// Send requests to the server
function sendRequest(data) {
    fetch('https://script.google.com/macros/s/AKfycbxaCGtz5m1f9tTb2jvJ81tiGRn2sl-rNbNtcpxNGZqabCUkqbiNBDuGGQtlbKDNW2Zqkw/exec', {
        mode: 'no-cors',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.text())
    .then(result => {
        console.log('Data sent successfully:', result);
    })
    .catch(error => {
        console.log('Error sending data:', error);
        // Save request in IndexedDB if it fails
        saveRequest(data);
    });
}

// Check for pending requests in IndexedDB
function checkForPendingRequests() {
    const transaction = db.transaction(['requests'], 'readonly');
    const objectStore = transaction.objectStore('requests');
    const getAll = objectStore.getAll();

    getAll.onsuccess = function() {
        const requests = getAll.result;
        if (requests.length > 0) {
            console.log('Sending pending requests:', requests);
            requests.forEach(request => {
                sendRequest(request);
            });

            // Clear the requests once they've been sent
            clearPendingRequests();
        }
    };
}

// Clear all pending requests in IndexedDB
function clearPendingRequests() {
    const transaction = db.transaction(['requests'], 'readwrite');
    const objectStore = transaction.objectStore('requests');
    const clearRequest = objectStore.clear();

    clearRequest.onsuccess = function() {
        console.log('All pending requests cleared');
    };

    clearRequest.onerror = function(event) {
        console.log('Error clearing pending requests:', event);
    };
}

// Handle form submission
//const form = document.getElementById('inForm2');
//const status = document.getElementById('status');

/*form.addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => { data[key] = value });

    // Try to send the data immediately if online
    if (navigator.onLine) {
        sendRequest(data);
        status.textContent = 'Data sent successfully!';
    } else {
        // Save the request in IndexedDB if offline
        saveRequest(data);
        status.textContent = 'Offline. Data will be sent when online.';
    }
});*/

// Listen for network status changes and send pending requests when back online
window.addEventListener('online', checkForPendingRequests);

// Open the IndexedDB database when the page loads
openDatabase();

// Fetch from network with a timeout
function fetchWithTimeout(request, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('Network request timed out'));
        }, timeout);

        fetch(request).then(
            response => {
                clearTimeout(timer);
                resolve(response);
            },
            err => {
                clearTimeout(timer);
                reject(err);
            }
        );
    });
}

// In the service worker
self.addEventListener('fetch', event => {
    if (event.request.method === 'GET') {
        event.respondWith(
            fetchWithTimeout(event.request).then(networkResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            }).catch(() => {
                return caches.match(event.request);
            })
        );
    } else {
        event.respondWith(fetch(event.request));
    }
});

function resizeImage(file, maxWidth, maxHeight) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
  
          // Original dimensions
          const originalWidth = img.width;
          const originalHeight = img.height;
  
          // Aspect ratio
          const aspectRatio = originalWidth / originalHeight;
  
          // New dimensions with aspect ratio preserved
          let newWidth = originalWidth;
          let newHeight = originalHeight;
  
          if (newWidth > maxWidth || newHeight > maxHeight) {
            if (newWidth > newHeight) {
              newWidth = maxWidth;
              newHeight = newWidth / aspectRatio;
            } else {
              newHeight = maxHeight;
              newWidth = newHeight * aspectRatio;
            }
          }
  
          // Set canvas size and draw resized image
          canvas.width = newWidth;
          canvas.height = newHeight;
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
  
          // Convert the canvas to a blob
          canvas.toBlob((blob) => resolve(blob), file.type, 0.8); // Adjust quality (0.8) as needed
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }