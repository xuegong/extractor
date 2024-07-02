import React, { useState } from 'react';
import './App.css';

function uint8ToHex(uint8Array: Uint8Array): string {
  return Array.from(uint8Array)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
}



function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    var dataStr = ''
    var devices = new Map()
    event.preventDefault();

    if (selectedFile) {
      const reader = new FileReader();
      const chunkSize = 17;
      let offset = 0;
      let activeDevice = '';
      let content = ''
      let expected_length = 0;

      reader.onloadend = function() {
        if (reader.readyState === FileReader.DONE) {

          if (reader.result) {
            let row= new Uint8Array(reader.result as ArrayBuffer);

            let timestamp =  uint8ToHex(row.slice(0, 4));
            let device = uint8ToHex(row.slice(4, 8));
            let data = uint8ToHex(row.slice(9, 17));
             
            if (!devices.get(device)) {
              devices.set(device, [])
            }

            
            let count = uint8ToHex(row.slice(9, 11))
            let starter = uint8ToHex(row.slice(9, 10))
            let control = uint8ToHex(row.slice(10, 11))
            let control_2 = uint8ToHex(row.slice(11, 12));
            // Case: Start request
            if (control_2 == '36' && activeDevice == '') {
              console.log(timestamp, device, data, "Starting a request.")
              content = ''
              activeDevice = device
              expected_length = Number('0x'+count)
              content = content.concat((uint8ToHex(row.slice(13,17))))
            } 
            // Case: Following packets
            else if (activeDevice == device && starter[0] == '2') {
              content = content.concat((uint8ToHex(row.slice(10,17))))
            }
            // Case: Ending
            else if (activeDevice != device && starter == '02' && control == '76') {
              console.log('ending found')
              activeDevice = ''
              devices.get(device).push([content, content.length, expected_length])
              expected_length = 0
            }


            // console.log(uint8ToHex(timestamp), uint8ToHex(device), uint8ToHex(data))

          }



          
          if (offset < selectedFile.size) {
            readNextChunk();
          } else {
            console.log('File reading finished');
            console.log(devices)
          }
        }
      };

      const readNextChunk = () => {
        const slice = selectedFile.slice(offset, offset + chunkSize);
        reader.readAsArrayBuffer(slice);
        offset += chunkSize;
      };

      readNextChunk(); // Start reading the first chunk
    } else {
      console.error('No file selected');
    }
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file)
      console.log('file set')
    }
  }


  return (
    <div className="App">
        <form onSubmit={handleSubmit}>
          <h1>React File Upload</h1>
          <input type="file" onChange = {handleFileChange} />
          <button type="submit">Extract Data</button>
        </form>
    </div>
  );
}



export default App;
