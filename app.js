// import { uid } from './uid.js';
// console.log(uid());
//nothing else to import because we are using the built in methods
//https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase

import { state } from './data.js';
import { uid } from './uid.js';

const IDB = (function init() {
    let db = null;
    let objectStore = null;
    let DBOpenReq = indexedDB.open('WhiskeyDB', 4);
    //change db structure or add table need to update version

    DBOpenReq.addEventListener('error', (err) => {
        //Error occurred while trying to open DB
        console.warn(err);
    });

    DBOpenReq.addEventListener('success', (ev) => {
        //DB has been opened... after upgradeneeded
        // another means this gonna be trigger after page load
        db = ev.target.result;
        console.log('success', db);
        if (typeof state !== undefined) {
            let tx = makeTx('whiskeyStore', 'readwrite');
            tx.oncomplete = (ev) => {
                console.log('finished adding data');
                buildList();
            };

            let store = tx.objectStore('whiskeyStore');
            let request = store.getAll();
            request.onsuccess = (ev) => {
                if (ev.target.result.length === 0) {
                    state.forEach((obj) => {
                        let req = store.add(obj);
                        req.onsuccess = (ev) => {
                            console.log('added an object');
                        };
                        //tx.abort() - if you want to kill transaction
                        req.onerror = (err) => {
                            console.warn('adding obj error', err);
                        };
                    });
                }
            };
            tx.onerror = (err) => {
                console.log(err);
            };
        } else {
            buildList();
        }
    });

    DBOpenReq.addEventListener('upgradeneeded', (ev) => {
        //first time opening this DB
        //OR a new version was passed into open()
        // can only create db in this place

        db = ev.target.result;
        console.log('upgrade', db);
        const oldVersion = ev.oldVersion;
        const newVersion = ev.newVersion || db.newVersion;

        console.log('oldVersion', oldVersion, 'to', 'newVersion', newVersion);
        console.log('upgrade', db.objectStoreNames);

        if (db.objectStoreNames.contains('whiskeyStore')) {
            db.deleteObjectStore('whiskeyStore');
        }

        objectStore = db.createObjectStore('whiskeyStore', {
            keyPath: 'id', // unique id for object store
        });
        objectStore.createIndex('nameIDX', 'name', { unique: false });
        objectStore.createIndex('countryIDX', 'country', { unique: false });
        objectStore.createIndex('ageIDX', 'age', { unique: false });
        objectStore.createIndex('lastEditIDX', 'lastEdit', { unique: false });
    });

    document.getElementById('btnUpdate').addEventListener('click', (ev) => {
        ev.preventDefault();
        let key = document.whiskeyForm.getAttribute('data-key');
        let name = document.getElementById('name').value.trim();
        let country = document.getElementById('country').value.trim();
        let age = parseInt(document.getElementById('age').value);
        let owned = document.getElementById('isOwned').checked;

        if (key) {
            let whiskey = {
                id: key,
                name,
                country,
                age,
                owned,
                lastEdit: Date.now(),
            };

            let tx = makeTx('whiskeyStore', 'readwrite');
            tx.oncomplete = (ev) => {
                console.log(ev);
                buildList();
                clearForm();
            };
            tx.onerror = (err) => {
                console.log(err);
            };

            let store = tx.objectStore('whiskeyStore');
            let request = store.put(whiskey);

            request.onsuccess = (ev) => {
                console.log('tx success updated an object');
            };

            request.onerror = (ev) => {
                console.log('tx updated error');
            };
        }
    });

    document.getElementById('btnDelete').addEventListener('click', (ev) => {
        ev.preventDefault();
        let key = document.whiskeyForm.getAttribute('data-key');
        if (key) {
            let tx = makeTx('whiskeyStore', 'readwrite');
            tx.oncomplete = (ev) => {
                console.log(ev);
                buildList();
                clearForm();
            };
            tx.onerror = (err) => {
                console.log(err);
            };

            let store = tx.objectStore('whiskeyStore');
            let request = store.delete(key);

            request.onsuccess = (ev) => {
                console.log('tx success deleted an object');
            };

            request.onerror = (ev) => {
                console.log('tx deleted error');
            };
        }
    });

    document.getElementById('btnAdd').addEventListener('click', (ev) => {
        ev.preventDefault();
        let name = document.getElementById('name').value.trim();
        let country = document.getElementById('country').value.trim();
        let age = parseInt(document.getElementById('age').value);
        let owned = document.getElementById('isOwned').checked;

        let whiskey = {
            id: uid(),
            name,
            country,
            age,
            owned,
            lastEdit: Date.now(),
        };

        let tx = makeTx('whiskeyStore', 'readwrite');
        tx.oncomplete = (ev) => {
            console.log(ev);
            buildList();
            clearForm();
        };
        tx.onerror = (err) => {
            console.log(err);
        };

        let store = tx.objectStore('whiskeyStore');
        let request = store.add(whiskey);

        request.onsuccess = (ev) => {
            console.log('tx success added an object');
        };

        request.onerror = (ev) => {
            console.log('tx error');
        };

        //one of the form buttons was clicked
    });

    document.getElementById('btnClear').addEventListener('click', clearForm);

    function clearForm(ev) {
        if (ev) ev.preventDefault();
        document.whiskeyForm.reset();
    }

    function buildList() {
        let list = document.querySelector('.wList');
        list.innerHTML = `<li>Loading...</li>`;
        let tx = makeTx('whiskeyStore', 'readonly');
        tx.oncomplete = (ev) => { };
        let store = tx.objectStore('whiskeyStore');
        //*version 1 - get all from store
        // let getReq = store.getAll();

        //*version 1 - get all with key range and index
        // let range = IDBKeyRange.lowerBound(14, false);
        // 14 or higher... true 15 or higher
        // true means exclude false mean include
        // let range = IDBKeyRange.bound(1, 10, false, false);
        // let idx = store.index('ageIDX');
        // let getReq = idx.getAll(range);
        //return an array
        //options can pass in a key or a keyrange
        // getReq.onsuccess = (ev) => {
        //get all was successful
        //     let request = ev.target;
        //     list.innerHTML = request.result
        //         .map((whiskey) => {
        //             return `<li data-key="${whiskey.id}">
        //         <span>${whiskey.name}</span>${whiskey.age}</li>`;
        //         })
        //         .join('\n');
        // };
        // getReq.onerror = (err) => {
        //     console.warn(err);
        // };

        //* version 3 - using a cursor
        let index = store.index('nameIDX');
        let range = IDBKeyRange.bound('J', 'M', false, false); //case sensitive
        list.innerHTML = '';
        //direction - next,nextunique,prev,prevunique
        index.openCursor(range).onsuccess = (ev) => {
            let cursor = ev.target.result;
            if (cursor) {
                console.log(cursor);
                let whiskey = cursor.value;
                list.innerHTML +=
                    `<li data-key="${whiskey.id}"><span>${whiskey.name}</span>${whiskey.age}</li>`;
                cursor.continue();
            } else {
                console.log('end of cursor');
            }
        };
    }

    function makeTx(storeName, mode) {
        const tx = db.transaction(storeName, mode);
        return tx;
    }

    document.querySelector('.wList').addEventListener('click', (ev) => {
        let li = ev.target.closest('[data-key]');
        let id = li.getAttribute('data-key');
        let tx = makeTx('whiskeyStore', 'readonly');
        console.log('tx.oncomplete', tx);
        tx.oncomplete = (ev) => {
            //get transaction complete
        };
        let store = tx.objectStore('whiskeyStore');
        let req = store.get(id);
        req.onsuccess = (ev) => {
            let request = ev.target;
            let whiskey = request.result;
            document.getElementById('name').value = whiskey.name;
            document.getElementById('country').value = whiskey.country;
            document.getElementById('age').value = whiskey.age;
            document.getElementById('isOwned').checked = whiskey.owned;
            document.whiskeyForm.setAttribute('data-key', whiskey.id);
        };
    });
})();
