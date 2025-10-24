export async function encryptToken(token: string, secretKey: string): Promise<string> {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for AES-GCM
  
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(secretKey),
      'PBKDF2',
      false,
      ['deriveKey']
    ); 
    const salt = "0xdeadbeefCAFEsalt123"

    // if(!salt){
    //     return "404"
    // }
  
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode(salt), // should match across services
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt']
    );
  
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(token)
    );
  
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const combined = new Uint8Array(iv.byteLength + encryptedBytes.byteLength);
    combined.set(iv);
    combined.set(encryptedBytes, iv.byteLength);
  
    return btoa(String.fromCharCode(...combined)); // base64 encode
  }
  


  async function decryptToken(encryptedBase64: string, secretKey: string): Promise<string> {
    const enc = new TextEncoder();
    const encryptedBytes = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  
    const iv = encryptedBytes.slice(0, 12); // first 12 bytes = IV
    const encryptedData = encryptedBytes.slice(12); // rest = actual ciphertext
  
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(secretKey),
      'PBKDF2',
      false,
      ['deriveKey']
    );
  
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode(process.env.NEXT_PUBLIC_SALT), 
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['decrypt']
    );
  
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );
  
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }
  

//   useEffect(() => {
//     const urlToken = new URLSearchParams(window.location.search).get('token');
//     const secret = process.env.NEXT_PUBLIC_ENCRYPTION_SECRET ?? ""; 

//     if(!secret){
//         toast.error('Unauthorized action')
//     }
  
//     if (urlToken) {
//       decryptToken(urlToken, secret)
//         .then((originalToken) => {
//           console.log("Decrypted token:", originalToken);
//           // Do something with the token
//         })
//         .catch((err) => {
//           console.error("Failed to decrypt token:", err);
//         });
//     }
//   }, []);
  