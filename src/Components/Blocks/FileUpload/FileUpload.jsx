import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { getCookie} from '../../../../graphQL_requests';

const UPLOAD_FILE_MUTATION = gql`
  mutation Mutation($file: Upload!) {
    singleUpload(file: $file) {
      filename
      mimetype
      encoding
    }
  }
`;

function FileUpload() {
  const [file, setFile] = useState(null);
  const token = getCookie('token');

  const [uploadFile, { data, loading, error }] = useMutation(UPLOAD_FILE_MUTATION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        'Apollo-Require-Preflight': 'true',
      },
    },
  });

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await uploadFile({
        variables: { file },
      });
      alert('File uploaded successfully');
    } catch (e) {
      console.error('Error uploading file:', e);
    }
  };

  return (
    <div>
      <h1>Upload File</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Uploading...' : 'Upload'}
      </button>

      {error && <p>Error: {error.message}</p>}
      {data && (
        <div>
          <p>Filename: {data.singleUpload.filename}</p>
          <p>Mimetype: {data.singleUpload.mimetype}</p>
          <p>Encoding: {data.singleUpload.encoding}</p>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
