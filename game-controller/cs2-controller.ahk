; CS2 Fan Control Effect Executor
#NoEnv
#SingleInstance Force
SendMode Input
SetWorkingDir %A_ScriptDir%

; WebSocket connection
WS := new WebSocket("ws://localhost:8081")
WS.OnMessage := Func("OnMessage")
WS.Connect()

; Effect state
global CurrentEffects := {}
global GameWindow := "Counter-Strike 2"

; Console key (usually ~)
global ConsoleKey := "``"

OnMessage(ws, data) {
    effect := JSON.Parse(data)
    
    if (effect.type = "execute") {
        ExecuteEffect(effect.effect)
    }
}

ExecuteEffect(effect) {
    WinActivate, %GameWindow%
    Sleep, 100
    
    category := effect.category
    id := effect.id
    
    ; Open console
    Send, %ConsoleKey%
    Sleep, 200
    
    ; Execute based on effect type
    if (category = "weapons") {
        if (id = "pistol_only") {
            SendConsoleCommand("mp_ct_default_secondary weapon_usp_silencer")
            SendConsoleCommand("mp_t_default_secondary weapon_glock")
            SendConsoleCommand("mp_ct_default_primary """"")
            SendConsoleCommand("mp_t_default_primary """"")
            SendConsoleCommand("mp_restartgame 1")
        }
        else if (id = "awp_madness") {
            SendConsoleCommand("mp_ct_default_primary weapon_awp")
            SendConsoleCommand("mp_t_default_primary weapon_awp")
            SendConsoleCommand("mp_restartgame 1")
        }
        else if (id = "knife_fight") {
            SendConsoleCommand("mp_drop_knife_enable 1")
            SendConsoleCommand("give weapon_knife")
            SendConsoleCommand("mp_ct_default_primary """"")
            SendConsoleCommand("mp_t_default_primary """"")
        }
    }
    else if (category = "movement") {
        if (id = "speed_boost") {
            SendConsoleCommand("sv_cheats 1")
            SendConsoleCommand("host_timescale 1.5")
            SetTimer, ResetSpeed, -30000
        }
        else if (id = "slow_motion") {
            SendConsoleCommand("sv_cheats 1")
            SendConsoleCommand("host_timescale 0.5")
            SetTimer, ResetSpeed, -20000
        }
        else if (id = "bunny_hop") {
            SendConsoleCommand("sv_enablebunnyhopping 1")
            SendConsoleCommand("sv_autobunnyhopping 1")
            SetTimer, ResetBunnyHop, -45000
        }
    }
    else if (category = "vision") {
        if (id = "night_mode") {
            SendConsoleCommand("mat_fullbright 1")
            SendConsoleCommand("r_screenoverlay effects/tp_eyefx/tp_eyefx.vmt")
            SetTimer, ResetVision, -60000
        }
        else if (id = "disco_mode") {
            ; Rapidly change colors
            Loop, 30 {
                Random, r, 0, 255
                Random, g, 0, 255
                Random, b, 0, 255
                SendConsoleCommand("mat_ambient_light_r " . r/255)
                SendConsoleCommand("mat_ambient_light_g " . g/255)
                SendConsoleCommand("mat_ambient_light_b " . b/255)
                Sleep, 1000
            }
            SendConsoleCommand("mat_ambient_light_r 0")
            SendConsoleCommand("mat_ambient_light_g 0")
            SendConsoleCommand("mat_ambient_light_b 0")
        }
    }
    else if (category = "chaos") {
        if (id = "friendly_fire") {
            SendConsoleCommand("mp_friendlyfire 1")
            SetTimer, ResetFriendlyFire, -45000
        }
        else if (id = "one_hp") {
            SendConsoleCommand("mp_startmoney 0")
            SendConsoleCommand("mp_maxmoney 0")
            SendConsoleCommand("mp_afterroundmoney 0")
            SendConsoleCommand("health 1")
        }
    }
    
    ; Close console
    Send, %ConsoleKey%
}

SendConsoleCommand(cmd) {
    SendRaw, %cmd%
    Send, {Enter}
    Sleep, 50
}

ResetSpeed:
    WinActivate, %GameWindow%
    Send, %ConsoleKey%
    Sleep, 100
    SendConsoleCommand("host_timescale 1")
    SendConsoleCommand("sv_cheats 0")
    Send, %ConsoleKey%
return

ResetBunnyHop:
    WinActivate, %GameWindow%
    Send, %ConsoleKey%
    Sleep, 100
    SendConsoleCommand("sv_enablebunnyhopping 0")
    SendConsoleCommand("sv_autobunnyhopping 0")
    Send, %ConsoleKey%
return

ResetVision:
    WinActivate, %GameWindow%
    Send, %ConsoleKey%
    Sleep, 100
    SendConsoleCommand("mat_fullbright 0")
    SendConsoleCommand("r_screenoverlay """"")
    Send, %ConsoleKey%
return

ResetFriendlyFire:
    WinActivate, %GameWindow%
    Send, %ConsoleKey%
    Sleep, 100
    SendConsoleCommand("mp_friendlyfire 0")
    Send, %ConsoleKey%
return

; Include WebSocket and JSON libraries
#Include WebSocket.ahk
#Include JSON.ahk