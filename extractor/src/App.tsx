import React, { useState } from 'react';
import logo from './logo.svg';
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
     

      reader.onloadend = function() {
        if (reader.readyState === FileReader.DONE) {

          // console.log('Chunk read:', reader.result);

          if (reader.result) {
            let row= new Uint8Array(reader.result as ArrayBuffer);

            let timestamp =  uint8ToHex(row.slice(0, 4));
            let device = uint8ToHex(row.slice(4, 8));
            let data = uint8ToHex(row.slice(9, 17));
             
            if (!devices.get(device)) {
              devices.set(device, [])
            }

            devices.get(device).push(data);
            
            
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
