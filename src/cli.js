import { parseArgs, styleText } from "node:util";

function renderHelp(options) {
  console.log(styleText("cyan", "Usage: music-tagger [options]"));
  console.log(styleText("cyan", "Options:"));
  Object.entries(options).forEach(([key, option]) => {
    const short = option.short ? `-${option.short}, ` : "";
    console.log(
      styleText(
        "cyan",
        `  ${short}--${key}${option.type === "boolean" ? "" : ` <${option.type}>`}`,
      ),
    );
    if (option.description) {
      console.log(styleText("gray", `    ${option.description}`));
    }
  });
  process.exit(0);
}

const options = {
  folder: {
    type: "string",
    short: "f",
    description: "Path to the folder containing music files",
  },
  file: { type: "string", description: "Path to a specific music file" },
  help: {
    type: "boolean",
    short: "h",
    description: "Show help information",
  },
};

try {
  const { values } = parseArgs({ options });

  const inputVal = Object.keys(values);

  if (!inputVal.length) {
    // show help
    renderHelp(options);
  }

  if (values.help) {
    renderHelp(options);
  }

  console.log(values);
} catch (error) {
  if (error.code === "ERR_PARSE_ARGS_UNKNOWN_OPTION") {
    console.error(
      styleText(
        "yellow",
        `${error.message}, use --help to see available options.`,
      ),
    );
  } else {
    console.error(
      styleText(
        "red",
        `Error parsing arguments: ${error.message}, use -h to see available options.`,
      ),
    );
  }

  process.exit(1);
}
