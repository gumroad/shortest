import { detect, resolveCommand } from "package-manager-detector";

export const getInstallationCommand = async () => {
  const packageManager = await detect();

  if (!packageManager) {
    throw new Error("No package manager detected");
  }

  const command = resolveCommand(packageManager.agent, "execute", [
    "playwright",
    "install",
    "chromium",
  ]);

  if (!command) {
    throw new Error(
      "Failed to resolve playwright browser installation command"
    );
  }

  return `${command.command} ${command.args.join(" ")}`;
};
