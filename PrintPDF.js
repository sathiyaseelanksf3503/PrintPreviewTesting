var printWindow = null;
var fileByteArray = [];

window.addEventListener('message', (event) => {
    if (event.data?.type === 'print-start') {
        console.log('Print event started');
    } else if (event.data?.type === 'print-end') {
        console.log('Print event ended');
    }
});

this.closePrintWindow = function () {
    if (this.printWindow && !this.printWindow.closed) {
        this.printWindow.close();
    }
};

function splitByteArray(byteArray) {
    if (byteArray) {
        if (fileByteArray) {
            let newByteArray = new Uint8Array(fileByteArray.length + byteArray.length);
            newByteArray.set(fileByteArray, 0);
            newByteArray.set(new Uint8Array(byteArray), fileByteArray.length);
            fileByteArray = newByteArray;
        }
        else {
            fileByteArray = byteArray;
        }
    }   
}

function printSameWindow(byteArray, issplit = false) {
    var blobUrl;
    if (issplit) {
        let newByteArray = new Uint8Array(this.fileByteArray.length + byteArray.length);
        newByteArray.set(this.fileByteArray, 0);
        newByteArray.set(new Uint8Array(byteArray), this.fileByteArray.length);
        this.fileByteArray = newByteArray;
        const BlobFile = new Blob([new Uint8Array(this.fileByteArray)], { type: 'application/pdf' });
        blobUrl = URL.createObjectURL(BlobFile);
    }
    else {
        const BlobFile = new Blob([new Uint8Array(byteArray)], { type: 'application/pdf' });
        blobUrl = URL.createObjectURL(BlobFile);
    }
    const info = getBrowserAndDeviceInfo();
    if (isSafariOniPad()) {
        OpenPrintForIpad(blobUrl);
    }
    else if (info.browser === "Chrome" && info.isMobile) {
        console.log("Opened in Chrome browser");
    }
    else if (info.browser === "Edge" && info.isMobile) {
        console.log("Opened in Edge browser");
    }
    else {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.src = blobUrl;

        window.dispatchEvent(new MessageEvent('message', {
            data: { type: 'print-start' },
            origin: window.origin
        }));

        let hasPrinted = false;

        const tryPrint = () => {
            if (hasPrinted) return;
            hasPrinted = true;

            try {
                if (iframe.contentWindow) {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                    window.postMessage({ type: 'print-end' }, '*');
                } else {
                    throw new Error("Unable to access iframe content");
                }
            } catch (error) {
                console.error("Error while trying to print:", error);
                alert("There was an error while trying to print. Please try again.");
            }
        };

        iframe.onload = () => {
            setTimeout(tryPrint, 1000);
        };

        setTimeout(tryPrint, 3000); // Fallback

        setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
            document.body.removeChild(iframe);
        }, 60000);
    }
}

// function printNewWindow(byteArray, fileName = 'document.pdf', issplit = false) {
//     var blobUrl;
//     if (issplit) {
//         let newByteArray = new Uint8Array(this.fileByteArray.length + byteArray.length);
//         newByteArray.set(this.fileByteArray, 0);
//         newByteArray.set(new Uint8Array(byteArray), this.fileByteArray.length);
//         this.fileByteArray = newByteArray;
//         const BlobFile = new Blob([new Uint8Array(this.fileByteArray)], { type: 'application/pdf' });
//         blobUrl = URL.createObjectURL(BlobFile);
//     }
//     else {
//         const BlobFile = new Blob([new Uint8Array(byteArray)], { type: 'application/pdf' });
//         blobUrl = URL.createObjectURL(BlobFile);
//     }
//     const info = getBrowserAndDeviceInfo();
//     if (isSafariOniPad()) {
//         OpenPrintForIpad(blobUrl);
//     }
//     else if (info.browser === "Chrome" && info.isMobile) {
//         printPdfFromBytes(byteArray); 
//     } else if (info.browser === "Edge" && info.isMobile) {
//         console.log("Opened in Edge browser");
//     } else {
//         const screenWidth = window.screen.availWidth;
//         const screenHeight = window.screen.availHeight;
//         const printWindow = window.open('', fileName, `width=${screenWidth},height=${screenHeight},top=0,left=0,toolbar=no,menubar=no,scrollbars=no,resizable=no`);
//         if (!printWindow) {
//             alert("Please allow pop-ups for this site.");
//             return;
//         }
//         const htmlContent = `
//             <!DOCTYPE html>
//             <html>
//             <head>
//                 <title>${fileName}</title>
//                 <style>
//                     html, body {
//                         margin: 0;
//                         padding: 0;
//                         height: 100%;
//                         overflow: hidden;
//                     }
//                     iframe {
//                         width: 100%;
//                         height: 100%;
//                         border: none;
//                     }
//                 </style>
//             </head>
//             <body>
//                 <iframe id="pdfFrame" src="${blobUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0"></iframe>
//                 <script>
//                     const iframe = document.getElementById('pdfFrame');
//                     iframe.onload = function () {
//                         setTimeout(() => {
//                             iframe.contentWindow.focus();
//                             iframe.contentWindow.print();
//                         }, 500);
//                     };

//                     // Notify parent when printing is done
//                     window.onafterprint = function () {
//                         window.close();
//                     };
//                 </script>
//             </body>
//             </html>
//         `;

//         printWindow.document.open();
//         printWindow.document.write(htmlContent);
//         printWindow.document.close();

//         setTimeout(() => {
//             URL.revokeObjectURL(blobUrl);
//         }, 60000);
//     }
// }

function isSafariOniPad() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return (isIOS && isSafari) || (isIPadOS && isSafari);
}

function getBrowserAndDeviceInfo() {
  const ua = navigator.userAgent;

  const isEdge = ua.includes("Edg/");
  const isChrome = ua.includes("Chrome") && !ua.includes("Edg/") && !ua.includes("OPR/");
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);

  return {
    browser: isEdge ? "Edge" : isChrome ? "Chrome" : "Other",
    isMobile: isMobile
  };
}

function OpenPrintForIpad(blobUrl) {
    const printWindow = window.open(blobUrl, '_blank');
    if (!printWindow) {
        alert("Failed to open the PDF. Please allow pop-ups for this site.");
        return;
    }
    const tryPrint = () => {
        printWindow.focus();
        printWindow.print();
    };
    printWindow.addEventListener('load', tryPrint);
    setTimeout(tryPrint, 3000);
    setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
    }, 60000); // Clean up after 1 minute
}


function printNewWindow(byteArray, fileName = 'document.pdf', issplit = false) {
    let blobUrl;

    if (issplit) {
        let newByteArray = new Uint8Array(this.fileByteArray.length + byteArray.length);
        newByteArray.set(this.fileByteArray, 0);
        newByteArray.set(new Uint8Array(byteArray), this.fileByteArray.length);
        this.fileByteArray = newByteArray;
        const BlobFile = new Blob([new Uint8Array(this.fileByteArray)], { type: 'application/pdf' });
        blobUrl = URL.createObjectURL(BlobFile);
    } else {
        const BlobFile = new Blob([new Uint8Array(byteArray)], { type: 'application/pdf' });
        blobUrl = URL.createObjectURL(BlobFile);
    }

    const info = getBrowserAndDeviceInfo();

    if (isSafariOniPad()) {
        OpenPrintForIpad(blobUrl);
    } else if (info.browser === "Chrome" && info.isMobile) {
        printPdfFromBytes(byteArray);
    } else if (info.browser === "Edge" && info.isMobile) {
        console.log("Opened in Edge browser");
    } else {
        const screenWidth = window.screen.availWidth;
        const screenHeight = window.screen.availHeight;
        const printWindow = window.open('', fileName, `width=${screenWidth},height=${screenHeight},top=0,left=0,toolbar=no,menubar=no,scrollbars=no,resizable=no`);
        if (!printWindow) {
            alert("Please allow pop-ups for this site.");
            return;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${fileName}</title>
                <style>
                    html, body {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        overflow: hidden;
                    }
                    iframe {
                        width: 100%;
                        height: 100%;
                        border: none;
                    }
                </style>
            </head>
            <body>
                <iframe id="pdfFrame" src="${blobUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0"></iframe>
                <script>
                    const iframe = document.getElementById('pdfFrame');
                    iframe.onload = function () {
                        setTimeout(() => {
                            iframe.contentWindow.focus();
                            iframe.contentWindow.print();
                        }, 500);
                    };

                    window.onafterprint = function () {
                        window.close();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
        }, 60000);
    }
}

function printPdfFromBytes(byteArray) {
  const isFirefox = /Gecko\/\d/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const firefoxDelay = 1000;
  let iframe = document.getElementById("print-pdf-iframe");

  if (!byteArray || !(byteArray instanceof Uint8Array || Array.isArray(byteArray))) {
    console.error("Invalid byte array provided.");
    return;
  }

  if (iframe) {
    iframe.remove();
  }

  const pdfBlob = new Blob([new Uint8Array(byteArray)], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(pdfBlob);

  iframe = document.createElement("iframe");
  iframe.id = "print-pdf-iframe";
  iframe.style.cssText =
    "width: 1px; height: 100px; position: fixed; left: 0; top: 0; opacity: 0; border-width: 0; margin: 0; padding: 0";
  iframe.src = blobUrl;

  iframe.addEventListener("load", function () {
    const openPrintPreview = () => {
      try {
        iframe.focus();
        iframe.contentWindow.print();
      } catch (error) {
        console.error("Print preview failed:", error);
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    };

    if (isFirefox) {
      setTimeout(openPrintPreview, firefoxDelay);
    } else if (isAndroid) {
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Print PDF</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              html, body { width: overflow: hidden; }
              #printButton {
                position: fixed;
                bottom: 10px;
                left: 50px;
                z-index: 9999;
                padding: 10px;
                background: #1F51FF;
                color: #fff;
                cursor: pointer;
                border: none;
                border-radius: 4px;
              }
              #pdfContainer {
                width: 100%;
                height: 100%;
                               align-items: center;
                justify-content: center;
              }
              @media print {
                #printButton { display: none; }
                html, body, #pdfContainer {
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100%;
                  height: 100%;
                  overflow: hidden !important;
                }
                #pdfContainer canvas {
                  width: 100% !important;
                  height: 100% !important;
                }
              }
            </style>
          </head>
          <body>
            <button id="printButton">Print</button>
            <div id="pdfContainer"></div>
            https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js
            <script>
              document.getElementById('printButton').addEventListener('click', () => window.print());
              const pdfContainer = document.getElementById('pdfContainer');
              const loadingTask = pdfjsLib.getDocument("${blobUrl}");
              loadingTask.promise.then(pdf => {
                pdf.getPage(1).then(page => {
                  const scale = 2;
                  const viewport = page.getViewport({ scale });
                  const canvas = document.createElement('canvas');
                  const context = canvas.getContext('2d');
                  canvas.height = viewport.height;
                  canvas.width = viewport.width;
                  page.render({ canvasContext: context, viewport }).promise.then(() => {
                    pdfContainer.innerHTML = '';
                    pdfContainer.appendChild(canvas);
                    canvas.style.width = '100%';
                    canvas.style.height = '100%';
                  });
                });
              });
            </script>
          </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        alert("Please allow popups for this website");
      }
    } else {
      openPrintPreview();
    }
  });

  document.body.appendChild(iframe);
}
