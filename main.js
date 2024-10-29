
import {createHash} from 'crypto';
import * as fs from 'fs/promises';
import fetch from 'node-fetch';
import FormData from 'form-data';

const appKey = "17282910700003b1";
const secretKey = "4a5491acbd59172b5c603f61e39ee1d5";
const userId = "uid";

const baseHOST = "api.speechsuper.com";

// const coreType = "word.eval.promax"; 
// const coreType = "sent.eval.promax"; 
const coreType = "para.eval"; 
const refText = `Amber and Sam like to bake. They plan to bake a cake for Mom. First, they collect what they need for the cake. They have cake mix, nuts, sugar and butter. 
					Next Sam put a pan on the stove. “We cannot bake on the stove,” Amber said “we need an oven to bake.” They get a pan and a brush. They brush the pan with butter. Sam chops the nuts. Amber mixes it with the cake mix and sugar. They hum a tune as they work.
					Now, the oven is hot. Amber and Sam want to be safe. They put on gloves and place the pan in the oven. They do not want to burn the cake. “Let’s watch the time,” says Sam. The cake will bake for a long time.
					At last, the cake is done! It is big, brown and smells nice. Amber and Sam grin. They made a cake for Mom. Mom will love it. 
					They gave Mom the cake. Mom smiled wide and gave them a hug. Amber and Sam are glad. They eat the cake with milk!`; 
const audioPath = "reducedsamplerate.wav"; 
const audioType = "wav"; 
const audioSampleRate = "48000";
// const audioUrl = `https://res.cloudinary.com/dnswqnlcp/video/upload/v1/cms/6b988d2a-ecf9-4643-9127-be415efedc11.wav`
// const audioUrl = `https://res.cloudinary.com/dnswqnlcp/video/upload/v1/cms/e1615ead-f10c-4f30-9a0f-8bb2059ee501.wav`
// const audioUrl = `https://res.cloudinary.com/dnswqnlcp/video/upload/v1/cms/2bba71b0-53c4-4dbd-97f0-9a63e9ae9435.wav`
const audioUrl = `https://res.cloudinary.com/dnswqnlcp/video/upload/v1/cms/93f3a728-22c7-4aab-8abe-b781df635d25.wav`

async function doEval(userId, audioType, sampleRate, requestParams, audioPath) {
    const coreType = requestParams['coreType'];
	
    let encrypt = function(content) {
        let hash = createHash("sha1");
        hash.update(content);
        return hash.digest('hex');
    }

	let getConnectSig = function () {
		var timestamp = new Date().getTime().toString();
		var sig = encrypt(appKey + timestamp + secretKey);
		return { sig: sig, timestamp: timestamp };
	}
	let getStartSig = function () {
		var timestamp = new Date().getTime().toString();
		var sig = encrypt(appKey + timestamp + userId + secretKey);
		return { sig: sig, timestamp: timestamp, userId: userId };
	}
	let createUUID = (function (uuidRegEx, uuidReplacer) {
		return function () {
			return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(uuidRegEx, uuidReplacer).toUpperCase();
		};
	})(/[xy]/g, function (c) {
		let r = Math.random() * 16 | 0,
			v = c == "x" ? r : (r & 3 | 8);
		return v.toString(16);
	});
	let connectSig = getConnectSig();
	let startSig = getStartSig();
    requestParams['tokenId'] = requestParams['tokenId'] || createUUID()
	let params = {
		connect: {
			cmd: "connect",
			param: {
				sdk: {
					version: 16777472,
					source: 9,
					protocol: 2
				},
				app: {
					applicationId: appKey,
					sig: connectSig.sig,
					timestamp: connectSig.timestamp
				}
			}
		},
		start: {
			cmd: "start",
			param: {
				app: {
					applicationId: appKey,
					sig: startSig.sig,
					userId: startSig.userId,
					timestamp: startSig.timestamp
				},
				audio: {
					audioType: audioType,
					sampleRate: sampleRate,
					channel: 1,
					sampleBytes: 2
				},
				request: requestParams
			}
		}
	};

    // request when we are passing the buffer from a public url
	// try {
    //     const audioResponse = await fetch(audioUrl);
    //     if (!audioResponse.ok) {
    //         throw new Error(`Failed to download audio file: ${audioResponse.statusText}`);
    //     }
    //     const audioData = await audioResponse.buffer();
	// 	console.log("BUFFER : ", audioData);
    //     const fd = new FormData();
    //     fd.append("text", JSON.stringify(params));
    //     fd.append("audio", audioData);

    //     const options = {
    //         host: baseHOST,
    //         path: "/" + coreType,
    //         method: "POST",
    //         protocol: "https:",
    //         headers: { "Request-Index": "0" }
    //     };

    //     return new Promise((resolve, reject) => {
    //         const req = fd.submit(options, (err, res) => {
    //             if (err) {
    //                 return reject(new Error(err.message));
    //             }
    //             if (res.statusCode < 200 || res.statusCode > 299) {
    //                 return reject(new Error(`HTTP status code ${res.statusCode}`));
    //             }
    //             const body = [];
    //             res.on('data', (chunk) => body.push(chunk));
    //             res.on('end', () => {
    //                 const resString = Buffer.concat(body).toString();
    //                 resolve(resString);
    //             });
    //         });
    //     });
    // } catch (error) {
    //     throw new Error(`Error during evaluation: ${error.message}`);
    // }

    // request when we are passing the path of the file from local storage
    return new Promise((resolve, reject) => {
        fs.readFile(audioPath)
        .then(audioData=> {
            let fd = new FormData();
            fd.append("text", JSON.stringify(params));
            fd.append("audio", audioData);
            let options = {
                host: baseHOST,
                path: "/" + coreType,
                method: "POST",
                protocol: "https:",
                headers: {"Request-Index": "0"}
            };

            try{
                const req = fd.submit(options, (err, res) => {
                    if(err){
                        return reject(new Error(err.message));
                    }
                    if(res.statusCode < 200 || res.statusCode > 299) {
                        return reject(new Error(`HTTP status code ${res.statusCode}`));
                    }
                    const body = [];
                    res.on('data', (chunk) => body.push(chunk));
                    res.on('end', ()=>{
                        const resString = Buffer.concat(body).toString();
                        resolve(resString);
                    });
                })
            }catch(e){
                reject(e);
            };
        }).catch(e=> {
            reject(e);
        })
    });
}


const requestParams = {
    coreType: coreType,
    refText: refText,
	getparam: 1,
	dict_type: 'KK',
	realtime_feedback: 1,
	paragraph_need_word_score: 1,
    accent_dialect: "indian",
    readtype_diagnosis: 1
};



doEval(userId, audioType, audioSampleRate, requestParams, audioPath)   // change audioPath to audioUrl when sending buffer from url
.then(data=>{console.log(data)})
.catch(e=>{console.log(e)});

