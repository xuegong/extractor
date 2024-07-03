import React, { useState } from 'react';
import './App.css';


function uint8ToHex(uint8Array: Uint8Array): string {
  return Array.from(uint8Array)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<boolean>(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    var dataStr = ''
    event.preventDefault();

    if (selectedFile) {
      const reader = new FileReader();
      const chunkSize = 17;
      let offset = 0;
      let activeDevice = '';
      let content = ''
      let expected_length = 0;
      let counted_bits = 0;

      reader.onloadend = function() {
        if (reader.readyState === FileReader.DONE) {

          if (reader.result) {
            let row= new Uint8Array(reader.result as ArrayBuffer);

            let timestamp =  uint8ToHex(row.slice(0, 4));
            let device = uint8ToHex(row.slice(4, 8));
            let data = uint8ToHex(row.slice(9, 17));

            let count = uint8ToHex(row.slice(9, 11))
            let starter = uint8ToHex(row.slice(9, 10))
            let control = uint8ToHex(row.slice(10, 11))
            let control_2 = uint8ToHex(row.slice(11, 12));
            let packetNumber = uint8ToHex(row.slice(12, 13))
            // Case: Start request
            if (control_2 === '36' && activeDevice === '') {
              console.log(timestamp, device, data, "Starting a request for packet " + packetNumber)
              content = ''
              activeDevice = device
              expected_length = Number('0x'+count.slice(1,4))
              content = content.concat((uint8ToHex(row.slice(13,17))))
              counted_bits += 6;
            } 
            // Case: Following packets
            else if (activeDevice === device && starter[0] === '2') {
              content = content.concat((uint8ToHex(row.slice(10,17))))
              counted_bits += 7;
            }
            // Case: Ending
            else if (activeDevice !== device && starter === '02' && control === '76') {
              console.log('Ending found for packet ' + control_2)
              activeDevice = ''
              let diff = counted_bits - expected_length
              if (diff > 0) {
                content = content.slice(0, content.length - (diff * 2))
              } else {
                console.error('unexpected packet length difference: ' + diff)
              }

              expected_length = 0
              counted_bits = 0

              dataStr+=content
            }
          }

          if (offset < selectedFile.size) {
            readNextChunk();
          } else {
            console.log('File reading finished');

            const utf16Bytes = hexToUtf16Bytes(dataStr);
            const blob = new Blob([utf16Bytes], { type: 'application/octet-stream' });

            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.href = url;
            link.download = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) + 'transferdata.bin';

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            URL.revokeObjectURL(url); 
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
      console.log('File set')
    }
  }

  function hexToUtf16Bytes(hex: string) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i+2), 16);
    }
    return bytes;
}


  return (
    <div className="App">
        <form onSubmit={(e)=>{setBusy(true); handleSubmit(e)}}>
          <h1>UDS Data Transfer Extractor</h1>
          <input type="file" onChange = {(e)=>{setBusy(false); handleFileChange(e)}} />
          <button type="submit" disabled={busy}>Extract Data</button>

          {busy && <div>Processing file... It will be downloaded once complete. Select a new file to re-enable the button.</div>}
        </form>
    </div>
  );
}



export default App;
