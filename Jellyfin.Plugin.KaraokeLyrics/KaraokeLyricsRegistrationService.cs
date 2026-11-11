using System.Reflection;
using System.Runtime.Loader;
using System.Text;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace Jellyfin.Plugin.KaraokeLyrics;

public sealed class KaraokeLyricsRegistrationService : IHostedService
{
    private const string ScriptId = "jellyfin-karaoke-lyrics";
    private const string ResourceName = "Jellyfin.Plugin.KaraokeLyrics.web.jellyfin-karaoke-lyrics.user.js";
    private readonly ILogger<KaraokeLyricsRegistrationService> _logger;

    public KaraokeLyricsRegistrationService(ILogger<KaraokeLyricsRegistrationService> logger)
    {
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            var injectorAssembly = AssemblyLoadContext.All
                .SelectMany(context => context.Assemblies)
                .FirstOrDefault(assembly =>
                    assembly.GetName().Name?.Equals("Jellyfin.Plugin.JavaScriptInjector", StringComparison.OrdinalIgnoreCase) == true);

            if (injectorAssembly is null)
            {
                _logger.LogWarning("JavaScript Injector was not found. Install the JavaScript Injector plugin, then restart Jellyfin.");
                return Task.CompletedTask;
            }

            var interfaceType = injectorAssembly.GetType("Jellyfin.Plugin.JavaScriptInjector.PluginInterface");
            var registerMethod = interfaceType?.GetMethod("RegisterScript", BindingFlags.Public | BindingFlags.Static);
            if (registerMethod is null)
            {
                _logger.LogWarning("JavaScript Injector does not expose the expected PluginInterface.RegisterScript API.");
                return Task.CompletedTask;
            }

            using var stream = typeof(KaraokeLyricsRegistrationService).Assembly.GetManifestResourceStream(ResourceName);
            if (stream is null)
            {
                _logger.LogError("Embedded karaoke lyrics script resource was not found: {ResourceName}", ResourceName);
                return Task.CompletedTask;
            }

            using var reader = new StreamReader(stream, Encoding.UTF8);
            var script = reader.ReadToEnd();
            var payload = new JObject
            {
                ["id"] = ScriptId,
                ["name"] = "Jellyfin Karaoke Lyrics",
                ["script"] = script,
                ["enabled"] = true,
                ["requiresAuthentication"] = false,
                ["pluginId"] = Plugin.PluginGuid.ToString(),
                ["pluginName"] = "Jellyfin Karaoke Lyrics",
                ["pluginVersion"] = "0.1.0.0"
            };

            var result = registerMethod.Invoke(null, [payload]);
            if (result is bool success && success)
                _logger.LogInformation("Registered Jellyfin Karaoke Lyrics with JavaScript Injector.");
            else
                _logger.LogWarning("JavaScript Injector did not confirm registration of Jellyfin Karaoke Lyrics.");
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unable to register Jellyfin Karaoke Lyrics with JavaScript Injector.");
        }

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        try
        {
            var injectorAssembly = AssemblyLoadContext.All
                .SelectMany(context => context.Assemblies)
                .FirstOrDefault(assembly =>
                    assembly.GetName().Name?.Equals("Jellyfin.Plugin.JavaScriptInjector", StringComparison.OrdinalIgnoreCase) == true);
            var interfaceType = injectorAssembly?.GetType("Jellyfin.Plugin.JavaScriptInjector.PluginInterface");
            var unregisterMethod = interfaceType?.GetMethod("UnregisterAllScriptsFromPlugin", BindingFlags.Public | BindingFlags.Static);
            unregisterMethod?.Invoke(null, [Plugin.PluginGuid.ToString()]);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Unable to unregister Jellyfin Karaoke Lyrics from JavaScript Injector during shutdown.");
        }

        return Task.CompletedTask;
    }
}
