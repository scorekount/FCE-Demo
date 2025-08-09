; CS2 Fan Control Effect Executor
#NoEnv
#SingleInstance Force
SendMode Input
SetWorkingDir %A_ScriptDir%

; WebSocket connection (you'll need to add WebSocket.ahk library)
; For now, we'll use a simpler approach with hotkeys for testing

; Console key (usually ~)
global ConsoleKey := "``"
global GameWindow := "Counter-Strike 2"

; Manual test hotkeys (for demo without WebSocket)
F1::ExecuteWeaponEffect("pistol_only")
F2::ExecuteWeaponEffect("awp_madness")
F3::ExecuteMovementEffect("speed_boost")
F4::ExecuteMovementEffect("slow_motion")
F5::ExecuteChaosEffect("friendly_fire")
F6::ExecuteChaosEffect("low_health")

ExecuteWeaponEffect(effect) {
    WinActivate, %GameWindow%
    Sleep, 100

    ; Open console
    Send, %ConsoleKey%
    Sleep, 200

    if (effect = "pistol_only") {
        SendConsoleCommand("mp_ct_default_secondary weapon_usp_silencer")
        SendConsoleCommand("mp_t_default_secondary weapon_glock")
        SendConsoleCommand("mp_ct_default_primary """)
        SendConsoleCommand("mp_t_default_primary """)
        SendConsoleCommand("mp_roundtime 2")
        SendConsoleCommand("mp_restartgame 1")
    }
    else if (effect = "awp_madness") {
        SendConsoleCommand("mp_ct_default_primary weapon_awp")
        SendConsoleCommand("mp_t_default_primary weapon_awp")
        SendConsoleCommand("mp_ct_default_secondary """)
        SendConsoleCommand("mp_t_default_secondary """)
        SendConsoleCommand("mp_restartgame 1")
    }

    ; Close console
    Send, %ConsoleKey%
}

ExecuteMovementEffect(effect) {
    WinActivate, %GameWindow%
    Sleep, 100

    Send, %ConsoleKey%
    Sleep, 200

    if (effect = "speed_boost") {
        SendConsoleCommand("sv_cheats 1")
        SendConsoleCommand("host_timescale 1.5")
        ; Reset after 30 seconds
        SetTimer, ResetSpeed, -30000
    }
    else if (effect = "slow_motion") {
        SendConsoleCommand("sv_cheats 1")
        SendConsoleCommand("host_timescale 0.5")
        ; Reset after 20 seconds
        SetTimer, ResetSpeed, -20000
    }

    Send, %ConsoleKey%
}

ExecuteChaosEffect(effect) {
    WinActivate, %GameWindow%
    Sleep, 100

    Send, %ConsoleKey%
    Sleep, 200

    if (effect = "friendly_fire") {
        SendConsoleCommand("mp_friendlyfire 1")
        SendConsoleCommand("mp_teammates_are_enemies 1")
        ; Reset after 45 seconds
        SetTimer, ResetFriendlyFire, -45000
    }
    else if (effect = "low_health") {
        SendConsoleCommand("sv_cheats 1")
        ; Give all players low health using CS2 commands
        SendConsoleCommand("ent_fire player addoutput ""health 10""")
        SendConsoleCommand("ent_fire player addoutput ""max_health 10""")
    }

    Send, %ConsoleKey%
}

ExecuteVisionEffect(effect) {
    WinActivate, %GameWindow%
    Sleep, 100

    Send, %ConsoleKey%
    Sleep, 200

    if (effect = "flashbang_party") {
        ; Give everyone flashbangs
        SendConsoleCommand("sv_cheats 1")
        SendConsoleCommand("sv_infinite_ammo 2")
        SendConsoleCommand("give weapon_flashbang")
        SendConsoleCommand("give weapon_flashbang")
    }
    else if (effect = "smoke_everywhere") {
        SendConsoleCommand("sv_cheats 1")
        SendConsoleCommand("give weapon_smokegrenade")
        Loop, 5 {
            SendConsoleCommand("ent_create smokegrenade_projectile")
            Sleep, 100
        }
    }

    Send, %ConsoleKey%
}

SendConsoleCommand(cmd) {
    SendRaw, %cmd%
    Send, {Enter}
    Sleep, 50
}

; Timer functions for resetting effects
ResetSpeed:
    WinActivate, %GameWindow%
    Send, %ConsoleKey%
    Sleep, 100
    SendConsoleCommand("host_timescale 1")
    SendConsoleCommand("sv_cheats 0")
    Send, %ConsoleKey%
return

ResetFriendlyFire:
    WinActivate, %GameWindow%
    Send, %ConsoleKey%
    Sleep, 100
    SendConsoleCommand("mp_friendlyfire 0")
    SendConsoleCommand("mp_teammates_are_enemies 0")
    Send, %ConsoleKey%
return

; For WebSocket integration (later)
; You'll need to download WebSocket.ahk and JSON.ahk libraries
; Then uncomment and modify this section:
/*
#Include WebSocket.ahk
#Include JSON.ahk

WS := new WebSocket("ws://localhost:8081")
WS.OnMessage := Func("OnMessage")
WS.Connect()

OnMessage(ws, data) {
    effect := JSON.Parse(data)

    if (effect.type = "execute") {
        category := effect.effect.category
        id := effect.effect.id

        if (category = "weapons") {
            ExecuteWeaponEffect(id)
        }
        else if (category = "movement") {
            ExecuteMovementEffect(id)
        }
        else if (category = "chaos") {
            ExecuteChaosEffect(id)
        }
        else if (category = "vision") {
            ExecuteVisionEffect(id)
        }
    }
}
*/