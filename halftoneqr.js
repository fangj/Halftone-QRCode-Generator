var pixelSize = 2;
var blockSize = (3*pixelSize);
var image;
var has_image = false;

function halftoneQR(QRBytes, controlBytes, image) {
    
    var canvas = $('#output').get(0);
    canvas.width = canvas.height = QRBytes.length * (3*pixelSize);
    var ctx = canvas.getContext('2d');
    var background = $('#background').val();
    
    $('#imageColour, #imageThreshold, #imagePixel').attr({
        width: canvas.width,
        height: canvas.height
    });
    if (has_image) {
        // Re-draw image (incase size changed)
        drawImage();
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    var canvasThreshold = $('#imageThreshold').get(0);
    var ctxThreshold = canvasThreshold.getContext('2d');
    
    if (has_image && background === 'image') {
        ctx.drawImage(canvasThreshold, 0, 0, canvas.width, canvas.height);
    }
    
    for (var byteRow = 0; byteRow < QRBytes.length; byteRow++) {
        for (var byteCell = 0; byteCell < QRBytes[byteRow].length; byteCell++) {
            
            if ((background === 'image' && !has_image) || background === 'noise') {
                // Draw random bytes
                ctx.fillStyle = 'black';
                for (var subRow = 0; subRow < 3; subRow++) {
                    for (var subCell = 0; subCell < 3; subCell++) {
                        ctx.fillStyle = 'black';
                        if (Math.random() < 0.5) {
                            ctx.fillStyle = 'white';
                        }
                        ctx.fillRect(byteRow * blockSize + (subRow * pixelSize), byteCell * blockSize + (subCell * pixelSize), pixelSize, pixelSize);
                    }
                }
            }
            
            // Middle Cell
            ctx.fillStyle = QRBytes[byteRow][byteCell] ? 'black' : 'white';
            ctx.fillRect(byteRow * blockSize + pixelSize, byteCell * blockSize + pixelSize, pixelSize, pixelSize);
        }
    }
    
    // Re-draw control bytes
    for (var byteRow = 0; byteRow < controlBytes.length; byteRow++) {
        for (var byteCell = 0; byteCell < controlBytes[byteRow].length; byteCell++) {
            if (controlBytes[byteRow][byteCell] !== null) {
                if (controlBytes[byteRow][byteCell] === true) {
                    ctx.fillStyle = 'black';
                } else {
                    ctx.fillStyle = 'white';
                }
                ctx.fillRect(byteRow * blockSize, byteCell * blockSize, blockSize, blockSize);
            }
        };
    };
    
    $('#download').attr('href', $('#output').get(0).toDataURL());
    
}

function drawImage() {
    var canvasColour = $('#imageColour').get(0);
    var ctxColour = canvasColour.getContext('2d');
    
    ctxColour.clearRect(0,0,canvasColour.width, canvasColour.height);
    ctxColour.drawImage(image, 0, 0, canvasColour.width, canvasColour.height);
    
    drawPixel();
}

function drawPixel() {
    var canvasColour = $('#imageColour').get(0);
    var canvasPixel = $('#imagePixel').get(0);
    var ctxPixel = canvasPixel.getContext('2d');
    var canvasTemp = document.createElement('canvas');
    canvasTemp.width = canvasTemp.height = (canvasPixel.width / pixelSize);
    var ctxTemp = canvasTemp.getContext('2d');
    
    ctxPixel.imageSmoothingEnabled =
        ctxPixel.mozImageSmoothingEnabled =
        ctxPixel.msImageSmoothingEnabled =
        ctxPixel.webkitImageSmoothingEnabled = 
        ctxTemp.imageSmoothingEnabled =
        ctxTemp.mozImageSmoothingEnabled =
        ctxTemp.msImageSmoothingEnabled =
        ctxTemp.webkitImageSmoothingEnabled = false;
    
    ctxTemp.drawImage(canvasColour, 0, 0, canvasTemp.width, canvasTemp.height);
    ctxPixel.drawImage(canvasTemp, 0, 0, canvasPixel.width, canvasPixel.height);
    
    drawThreshold();
}

function drawThreshold() {
    var canvasPixel = $('#imagePixel').get(0);
    var ctxPixel = canvasPixel.getContext('2d');
    var canvasThreshold = $('#imageThreshold').get(0);
    var ctxThreshold = canvasThreshold.getContext('2d');
    
    var pixels = ctxPixel.getImageData(0,0,canvasPixel.width,canvasPixel.height);
    var d = pixels.data;
    var width = Math.sqrt(d.length / 4) / pixelSize;
    for (var i=0; i<d.length; i+=4) {
        var r = d[i];
        var g = d[i+1];
        var b = d[i+2];
        var grey = (r * 0.2126 + g * 0.7152 + b * 0.0722);
        //var v = (grey >= 127) ? 255 : 0;
        //d[i] = d[i+1] = d[i+2] = v;
        d[i] = d[i+1] = d[i+2] = grey;
    }
    
    for (var i=0; i<d.length; i+=4) {
        var grey = d[i];
        var v = (grey >= 127) ? 255 : 0;
        
        // Dithering
        var error = (grey - v) / 8;
        var i2 = i / 4;
        var row = Math.floor(i2 / width);
        var cell = i2 % width;
        
        d[i] = d[i+1] = d[i+2] = v;
        
        d[(((row + 0) * width) + (cell + 1)) * 4] = d[(((row + 0) * width) + (cell + 1)) * 4 + 1] = d[(((row + 0) * width) + (cell + 1)) * 4 + 2] = d[(((row + 0) * width) + (cell + 1)) * 4] + error;
        d[(((row + 0) * width) + (cell + 2)) * 4] = d[(((row + 0) * width) + (cell + 2)) * 4 + 1] = d[(((row + 0) * width) + (cell + 2)) * 4 + 2] = d[(((row + 0) * width) + (cell + 2)) * 4] + error;
        d[(((row + 1) * width) + (cell - 1)) * 4] = d[(((row + 1) * width) + (cell - 1)) * 4 + 1] = d[(((row + 1) * width) + (cell - 1)) * 4 + 2] = d[(((row + 1) * width) + (cell - 1)) * 4] + error;
        d[(((row + 1) * width) + (cell + 0)) * 4] = d[(((row + 1) * width) + (cell + 0)) * 4 + 1] = d[(((row + 1) * width) + (cell + 0)) * 4 + 2] = d[(((row + 1) * width) + (cell + 0)) * 4] + error;
        d[(((row + 1) * width) + (cell + 1)) * 4] = d[(((row + 1) * width) + (cell + 1)) * 4 + 1] = d[(((row + 1) * width) + (cell + 1)) * 4 + 2] = d[(((row + 1) * width) + (cell + 1)) * 4] + error;
        d[(((row + 2) * width) + (cell + 0)) * 4] = d[(((row + 2) * width) + (cell + 0)) * 4 + 1] = d[(((row + 2) * width) + (cell + 0)) * 4 + 2] = d[(((row + 2) * width) + (cell + 0)) * 4] + error;
    }
    ctxThreshold.putImageData(pixels, 0, 0);
}
$(function(){
    $('body').on('dragover', function(e) {
    e.preventDefault();
    $('body').addClass('hover');
});
$('#overlay').on('dragend dragleave', function(e) {
    e.preventDefault();
    $('body').removeClass('hover');
});
$('#overlay').on('drop', function(e) {
    e.preventDefault();
    $('body').removeClass('hover');
    
    var file = e.originalEvent.dataTransfer.files[0],
        reader = new FileReader();
    reader.onload = function(event) {
        //event.target.result;
        var imageColour = new Image();
        imageColour.onload = function() {
            has_image = true;
            image = this;
            drawImage();
        }
        imageColour.src = event.target.result;
    };
    reader.readAsDataURL(file);
    
    return false;
});

$(function() {
    
    $('#go').on('click', function() {
        var text = $('#input').val();
        
        var errorLevel = $('#error_level').val();
        
        var sizes = {
            L: [152, 272, 440, 640, 864, 1088, 1248, 1552, 1856, 1240],
            M: [128, 224, 352, 512, 688, 864,  992,  700,  700,  524],
            Q: [104, 176, 272, 384, 286, 608,  508,  376,  608,  434],
            H: [72,  128, 208, 288, 214, 480,  164,  296,  464,  346]
        };
        
        var userSize = parseInt($('#size').val());
        var QRsize = -1;
        if (userSize === 0) {
            for (var i = 0; i < sizes[errorLevel].length; i++) {
                if (text.length < sizes[errorLevel][i]) {
                    QRsize = i + 1;
                    break;
                }
            };
        } else {
            if (text.length < sizes[errorLevel][userSize - 1]) {
                QRsize = userSize;
            }
        }
        if (QRsize == -1) {
            if (userSize === 0) {
                if (errorLevel === 'H') {
                    alert('Too much text.');
                } else {
                    alert('Too much text. Try decreasing the error level.');
                }
            } else {
                alert('Too much text. Try decreasing the error level or increasing the size.');
            }
            return;
        }
        
        var qr = qrcode(QRsize, errorLevel);
        qr.addData(text);
        qr.make();
        
        var controls = qrcode(QRsize, errorLevel);
        controls.addData(text);
        controls.make(true);
        
        halftoneQR(qr.returnByteArray(), controls.returnByteArray());
        
    });
    
    // First load (cat)
    var imageColour = new Image();
    imageColour.onload = function() {
        has_image = true;
        image = this;
        $('#go').triggerHandler('click');
    }
    imageColour.src = 'data:image/jpeg;base64,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';
    
    });
})

