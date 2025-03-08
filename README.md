# 🌟 Web Tools 🌟

## 📌 Overview

Welcome to **Web Tools**, your go-to client-side web application for a variety of digital tasks. With a strong focus on privacy and security, these tools process everything directly in your browser, ensuring your data never leaves your device. From merging PDFs to generating QR codes for hospitality businesses, our collection of tools helps simplify your digital workflows while maintaining 100% privacy.

---

## 🎯 Features

### PDF & Image Tools

- **Client-side PDF merging**: Combine multiple PDFs into a single document with no backend processing
- **Image to PDF conversion**: Convert and include images in your PDF documents
- **No file uploads**: Your files stay on your device, ensuring maximum privacy
- **Simple drag & drop interface**: Easy file management and reordering

### QR Code Generator & Scanner

- **Multi-purpose QR codes**: Generate QR codes for URLs, text, Wi-Fi credentials, and contact information
- **Built-in QR scanner**: Scan QR codes using your camera or from uploaded images
- **Customization options**: Adjust colors, size, and other properties of your QR codes
- **Perfect for hospitality**: Create QR codes for guest Wi-Fi access, contact info, and check-in instructions

### Network Tools

- **CIDR Subnet Calculator**: Calculate network addresses, broadcast addresses, and IP ranges
- **Subnet creator**: Generate subnet allocations for network planning
- **Visual IP range display**: Easily understand IP allocations

### Developer Tools

- **Code Formatter & Beautifier**: Format and beautify code in multiple languages
- **Base64 Encoder/Decoder**: Convert text or binary data to and from Base64 encoding
- **Syntax highlighting**: Properly formatted code with color highlighting

---

## 🔐 Privacy & Security

All Web Tools operate with these core principles:

- **100% Client-side Processing**: All computations happen in your browser
- **No Data Transmission**: Your files and information never leave your device
- **No Data Storage**: Nothing is saved on servers
- **Open Source**: Transparent code that you can verify

🚀 **Runs safely and securely in your browser** 🚀

---

## 🚀 Live Deployment

Check out the live deployment of the application here:  
👉 [https://web-tools.romitagl.com/](https://web-tools.romitagl.com/)

---

## 📋 Tools Available

- **PDF & Image Merger**: Combine multiple PDFs and images into a single document
- **QR Code Generator & Scanner**: Create and scan QR codes for various purposes
- **CIDR Subnet Calculator**: Network planning and IP address management
- **Code Formatter**: Beautify and format code in multiple languages
- **Base64 Encoder/Decoder**: Encode and decode text or binary data

---

## 📊 Stats

![GitHub Stars](https://img.shields.io/github/stars/romitagl/web-tools?style=social)  
![GitHub Forks](https://img.shields.io/github/forks/romitagl/web-tools?style=social)  
![GitHub Issues](https://img.shields.io/github/issues/romitagl/web-tools)  
![GitHub Last Commit](https://img.shields.io/github/last-commit/romitagl/web-tools)  

---

## 🛠️ Getting Started

### 1. **Install Dependencies**

To get started, you'll need to install the necessary dependencies. Run the following command:

```bash
make install
```

### 2. **Start Development Server**

Once the dependencies are installed, start the development server with:

```bash
make start
```

### 3. **Building the Application**

To create a production build, use:

```bash
make build
```

### 4. **Docker Deployment**

If you prefer using Docker, you can build and run the Docker image with the following commands:

```bash
# Build Docker image
make docker-build
# Run development server with hot-reload
make docker-run
# Build in Docker and export build artifacts
make docker-export
# Display help message
make docker-help
# Update node dependencies in Docker container
make docker-npm-update
# Run node command in Docker container. Example: make docker-run-node-cmd CMD="npm run build"
make docker-run-node-cmd
```

---

## 🧰 Technology Stack

- **Frontend**: React, TailwindCSS, Vite
- **PDF Processing**: pdf-lib
- **QR Code**: qrcode.js, jsQR
- **UI Components**: Lucide React icons
- **Code Formatting**: Prism.js

---

## 🧩 Project Structure

```
web-tools/
├── src/
│   ├── components/     # UI components
│   ├── css/            # Modular CSS files
│   ├── assets/         # Static assets
│   └── App.jsx         # Main application component
├── public/             # Public assets
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies
```

---

## 📜 License

This project is licensed under the Mozilla Public License Version 2.0. See the [LICENSE](LICENSE) file for more details.

---

## 🙏 Acknowledgments

- Thanks to all the contributors who have helped make this project a reality.
- Special thanks to the open-source community for providing the tools and libraries that made this project possible.
