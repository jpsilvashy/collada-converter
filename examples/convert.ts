/// <reference path="../lib/collada.d.ts" />
/// <reference path="external/jquery/jquery.d.ts" />
/// <reference path="convert-renderer.ts" />
/// <reference path="convert-options.ts" />

var use_threejs: boolean = true;


// ----------------------------------------------------------------------------
// Evil global data
// ----------------------------------------------------------------------------
interface i_elements {
    input?: HTMLInputElement;
    log_progress?: HTMLTextAreaElement;
    log_loader?: HTMLTextAreaElement;
    log_converter?: HTMLTextAreaElement;
    log_exporter?: HTMLTextAreaElement;
    output?: HTMLTextAreaElement;
    download_json?: HTMLAnchorElement;
    download_data?: HTMLAnchorElement;
    download_threejs?: HTMLAnchorElement;
    mesh_parts_checkboxes?: HTMLInputElement[];
    mesh_parts_labels?: HTMLLabelElement[];
};
var elements: i_elements = {};

var timestamps: {[name: string]:number} = {};
var options: COLLADA.Converter.Options = new COLLADA.Converter.Options();
var optionElements: ColladaConverterOption[] = [];

interface i_conversion_data {
    stage: number;
    exception: boolean;
    s0_source: string;                             // Stage 0: raw file string
    s1_xml: Document;                              // Stage 1: XML document
    s2_loaded: COLLADA.Loader.Document;            // Stage 2: COLLADA document
    s3_converted: COLLADA.Converter.Document;      // Stage 3: Converted document
    s4_exported_custom: COLLADA.Exporter.Document; // Stage 4: JSON + binary
    s5_exported_threejs: any;                      // Stage 5: JSON
}

var conversion_data: i_conversion_data = {
    stage: null,
    exception: null,
    s0_source: null,
    s1_xml: null,
    s2_loaded: null,
    s3_converted: null,
    s4_exported_custom: null,
    s5_exported_threejs: null
}

// ----------------------------------------------------------------------------
// Misc
// ----------------------------------------------------------------------------

function fileSizeStr(bytes: number): string {
    if (bytes < 1024) {
        return "" + (bytes) + " B";
    } else if (bytes < 1024 * 1024) {
        return "" + (bytes / 1024).toFixed(2) + " kB";
    } else if (bytes < 1024 * 1024) {
        return "" + (bytes / (1024 * 1024)).toFixed(2) + " MB";
    } else if (bytes < 1024 * 1024 * 1024) {
        return "" + (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
    } else {
        return ">1TB";
    }
}

// ----------------------------------------------------------------------------
// Log
// ----------------------------------------------------------------------------

function writeProgress(msg: string) {
    $("#log").append(msg + "\n");
}

function writeLog(name: string, message: string, level: COLLADA.LogLevel) {
    var line: string = COLLADA.LogLevelToString(level) + ": " + message;
    $("#log").append("[" + name + "] " + line + "\n");
}

function clearLog() {
    $("#log").val("");
}

function timeStart(name: string) {
    timestamps[name] = performance.now();
    writeProgress(name + " started"); 
}

function timeEnd(name: string) {
    var endTime = performance.now();
    var startTime = timestamps[name];
    writeProgress(name + " finished (" + (endTime - startTime).toFixed(2) + "ms)"); 
}

// ----------------------------------------------------------------------------
// Reset
// ----------------------------------------------------------------------------

function reset() {

    conversion_data = {
        stage: -1,
        exception: null,
        s0_source: "",
        s1_xml: null,
        s2_loaded: null,
        s3_converted: null,
        s4_exported_custom: null,
        s5_exported_threejs: null
    }

    clearLog();
    updateUIInput();
    updateUIOutput();
    updateUIRenderer();
    updateUIProgress();
}

function resetOutput() {

    conversion_data.stage = -1;
    conversion_data.exception = null;
    conversion_data.s1_xml = null;
    conversion_data.s2_loaded = null;
    conversion_data.s3_converted = null;
    conversion_data.s4_exported_custom = null;
    conversion_data.s5_exported_threejs = null;

    clearLog();
    updateUIInput();
    updateUIOutput();
    updateUIRenderer();
    updateUIProgress();
}

// ----------------------------------------------------------------------------
// UI
// ----------------------------------------------------------------------------

function updateUIProgress() {
    if (conversion_data.stage >= 0) {
        $("#progress-container").removeClass("hidden");
        $("#progress").css("width", (100*conversion_data.stage / 5).toFixed(1) + "%");
    } else {
        $("#progress-container").addClass("hidden");
    }
}

function updateUIInput() {

}

function updateUIOutput() {
    /*
    // Download links
    elements.download_json.href = COLLADA.Exporter.Utils.jsonToDataURI(json, null);
    elements.download_json.textContent = "Download (" + (JSON.stringify(json).length / 1024).toFixed(1) + " kB)";
    elements.download_data.href = COLLADA.Exporter.Utils.bufferToBlobURI(data);
    elements.download_data.textContent = "Download (" + (data.length / 1024).toFixed(1) + " kB)";

    // Output
    elements.output.textContent = JSON.stringify(json, null, 2);
    resetCheckboxes(json.chunks);

    elements.download_threejs.href = COLLADA.Exporter.Utils.jsonToBlobURI(threejsData);
    elements.download_threejs.textContent = "Download (" + (JSON.stringify(threejsData).length / 1024).toFixed(1) + " kB)";
    */

    /*
    for (var i: number = 0; i < elements.mesh_parts_checkboxes.length; ++i) {
        var checkbox: HTMLInputElement = elements.mesh_parts_checkboxes[i];
        var label: HTMLLabelElement = elements.mesh_parts_labels[i];
        checkbox.checked = true;
        if (chunks.length <= i) {
            checkbox.style.setProperty("display", "none");
            label.style.setProperty("display", "none");
        } else {
            checkbox.style.removeProperty("display");
            label.style.removeProperty("display");
            label.textContent = chunks[i].name;
        }
    }
    */
}

function updateUIRenderer() {

    /*
    if (use_threejs) {
        clearBuffersThreejs();
    } else {
        clearBuffers();
    }
    */

    /*
    // Start rendering
    timeStart("WebGL loading");
    if (use_threejs) {
        fillBuffersThreejs(json, data.buffer);
    } else {
        fillBuffers(json, data.buffer);
        setupCamera(json);
    }
    timeEnd("WebGL loading");

    timeStart("WebGL rendering");
    if (use_threejs) {
        tickThreejs(null);
    } else {
        tick(null);
    }
    timeEnd("WebGL rendering");
    */
}

// ----------------------------------------------------------------------------
// Drag & Drop
// ----------------------------------------------------------------------------

function onFileDrag(ev: JQueryEventObject) {
    ev.preventDefault();
}

function onFileDrop(ev: JQueryEventObject) {
    writeProgress("Something dropped.");
    ev.preventDefault();
    var dt = (<any>ev.originalEvent).dataTransfer;
    if (!dt) {
        writeProgress("Your browser does not support drag&drop for files (?).");
        return;
    }
    var files = dt.files;
    if (files.length == 0) {
        writeProgress("You did not drop a file. Try dragging and dropping a file instead.");
        return;
    }
    if (files.length > 1) {
        writeProgress("You dropped multiple files. Please only drop a single file.");
        return;
    }

    onFileLoad(files[0]);
}


function onFileLoad(file: File) {
    // Reset all data
    reset();

    // File reader
    var reader = new FileReader();
    reader.onload = () => {
        timeEnd("Reading file");
        var result: string = reader.result;
        convertSetup(result);
    };
    reader.onerror = () => {
        writeProgress("Error reading file.");
    };
    timeStart("Reading file");

    // Read
    reader.readAsText(file);
}

// ----------------------------------------------------------------------------
// Conversion
// ----------------------------------------------------------------------------

function convertSetup(src: string) {
    // Set the source data
    conversion_data.s0_source = src;
    conversion_data.stage = 1;
}

function convertTick() {
    // Synchronously perform one step of the conversion
    try {
        switch (conversion_data.stage) {
            case 1: convertParse(); break;
            case 2: convertLoad(); break;
            case 3: convertConvert(); break;
            case 4: convertExportCustom(); break;
            case 5: convertExportThreejs(); break;
            case 6: updateUIOutput(); updateUIRenderer(); break;
            default: throw new Error("Unknown stage");
        }
    } catch (e) {
        conversion_data.exception = true;
    }

    // Update the progress bar
    updateUIProgress();
}

function convertNextStage() {
    conversion_data.stage++;
    setTimeout(convertTick, 10);
}

function convertParse() {
    // Parser
    var parser = new DOMParser();

    // Parse
    timeStart("XML parsing");
    conversion_data.s1_xml = parser.parseFromString(conversion_data.s0_source, "text/xml");
    timeEnd("XML parsing");

    // Next stage
    convertNextStage();
}

function convertLoad() {
    // Loader
    var loader = new COLLADA.Loader.ColladaLoader();
    var loaderlog = new COLLADA.LogCallback;
    loaderlog.onmessage = (message: string, level: COLLADA.LogLevel) => { writeLog("loader", message, level); }
    loader.log = new COLLADA.LogFilter(loaderlog, COLLADA.LogLevel.Info);

    // Load
    timeStart("COLLADA parsing");
    conversion_data.s2_loaded = loader.loadFromXML("id", conversion_data.s1_xml);
    timeEnd("COLLADA parsing");

    // Next stage
    convertNextStage();
}

function convertConvert() {
    // Converter
    var converter = new COLLADA.Converter.ColladaConverter();
    var converterlog = converter.log = new COLLADA.LogCallback;
    converterlog.onmessage = (message: string, level: COLLADA.LogLevel) => { writeLog("converter", message, level); }
    converter.options = options;

    // Convert
    timeStart("COLLADA conversion");
    conversion_data.s3_converted = converter.convert(conversion_data.s2_loaded);
    timeEnd("COLLADA conversion");

    // Next stage
    convertNextStage();
}

function convertExportCustom() {
    // Exporter
    var exporter = new COLLADA.Exporter.ColladaExporter();
    var exporterlog = exporter.log = new COLLADA.LogCallback;
    exporterlog.onmessage = (message: string, level: COLLADA.LogLevel) => { writeLog("converter", message, level); }

    // Export
    timeStart("COLLADA export");
    conversion_data.s4_exported_custom = exporter.export(conversion_data.s3_converted);
    timeEnd("COLLADA export");

    // Next stage
    convertNextStage();
}

function convertExportThreejs() {
    // Exporter2
    var exporter = new COLLADA.Threejs.ThreejsExporter();
    var exporterlog = exporter.log = new COLLADA.LogCallback;
    exporterlog.onmessage = (message: string, level: COLLADA.LogLevel) => { writeLog("threejs", message, level); }

    // Export2
    timeStart("Threejs export");
    conversion_data.s5_exported_threejs = exporter.export(conversion_data.s3_converted);
    timeEnd("Threejs export");

    // Next stage
    convertNextStage();
}

function onConvertClick() {
    // Delete any previously converted data
    resetOutput();

    // Start the conversion
    conversion_data.stage = 1;
    setTimeout(convertTick, 10);
}

// ----------------------------------------------------------------------------
// Initialization
// ----------------------------------------------------------------------------

function init() {
    // Initialize WebGL
    var canvas: HTMLCanvasElement = <HTMLCanvasElement>$("#canvas")[0];
    if (use_threejs) {
        initThreejs(canvas);
    } else {
        initGL(canvas);
    }

    // Create option elements
    var optionsForm = $("#form-options");
    optionElements.push(new ColladaConverterOption(options.enableAnimations, optionsForm));
    optionElements.push(new ColladaConverterOption(options.animationFps, optionsForm));
    optionElements.push(new ColladaConverterOption(options.worldTransform, optionsForm));
    optionElements.push(new ColladaConverterOption(options.worldTransformScale, optionsForm));
    optionElements.push(new ColladaConverterOption(options.worldTransformRotationAxis, optionsForm));
    optionElements.push(new ColladaConverterOption(options.worldTransformRotationAngle, optionsForm));
    optionElements.push(new ColladaConverterOption(options.sortBones, optionsForm));
    optionElements.push(new ColladaConverterOption(options.applyBindShape, optionsForm));
    optionElements.push(new ColladaConverterOption(options.singleBufferPerGeometry, optionsForm));

    // Register events
    $("#drop-target").on("dragover", onFileDrag);
    $("#drop-target").on("drop", onFileDrop);
    $("#drop-target").on("drop", onFileDrop);
    $("#convert").click(onConvertClick);

    // Update all UI elements
    reset();
}