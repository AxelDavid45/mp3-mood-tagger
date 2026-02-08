import { parseArgs, styleText } from "node:util";

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
} catch (error) {
  if (error.code === "ARG_UNKNOWN_OPTION") {
    console.log(styleText("yellow", `Unknown option: ${error.option}`));
  } else {
    console.error(
      styleText("red", `Error parsing arguments: ${error.message}`),
    );
  }

  process.exit(1);
}
