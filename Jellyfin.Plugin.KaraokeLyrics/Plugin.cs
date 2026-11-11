using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;

namespace Jellyfin.Plugin.KaraokeLyrics;

public sealed class Plugin : BasePlugin<PluginConfiguration>
{
    public static readonly Guid PluginGuid = Guid.Parse("a3f4e9d2-7b61-4c85-9a20-6e1d3f8b5c72");

    public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer)
        : base(applicationPaths, xmlSerializer)
    {
    }

    public override string Name => "Jellyfin Karaoke Lyrics";
    public override Guid Id => PluginGuid;
}

public sealed class PluginConfiguration : BasePluginConfiguration
{
}
