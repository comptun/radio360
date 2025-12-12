// Fragment shader for the planet

const fsPlanet = `

    precision mediump float;

    uniform vec2 iMouse;
    uniform vec2 iResolution;
    uniform float iTime;
    uniform float Zoom;
    uniform sampler2D iChannel0;
    uniform sampler2D iChannel1;
    uniform sampler2D iChannel2;
    uniform sampler2D iChannel3;

    varying vec4 fragCoord;

    #define Pi 3.14159265359
    #define d2r(a) ((a)*180.0/Pi)
    #define RGB(r,g,b) pow(vec3(float(r), float(g), float(b))/255.0, vec3(2.22))

    mat3 rotX(float a){
        float s = sin(a), c = cos(a);
        return mat3(1,0,0,  0,c,-s,  0,s,c);
    }

    mat3 rotY(float a){
        float s = sin(a), c = cos(a);
        return mat3(c,0,s,  0,1,0, -s,0,c);
    }


    vec3 Render(in vec2 uv)
    {

        float R0 = 1.0;	// Nomralized Earth radius (6360 km)
        float R1 = 1.0094;	// Atmosphere radius (6420 km) 

        vec3 Color = vec3(0.0);
        float t = 10.0;//1.0*iTime;

        // Sun:
        vec3 L0 = vec3(cos(0.1*t), 0.0, sin(0.1*t));
        float cs = cos(d2r(90.0 + 23.4)), sn = sin(d2r(90.0 + 23.4));
        vec3 LightDir = vec3(cs*L0.x + sn*L0.y, cs*L0.y - sn*L0.x, L0.z);

        vec2 SunC = -5.0*LightDir.xy/LightDir.z - uv;
        float Halo = max(0.0, dot(LightDir, normalize(vec3(uv.x, uv.y, -5.0))));
        float SunRay = pow(texture2D(iChannel1, vec2(0.1*t, atan(SunC.x,SunC.y))).xyz, vec3(2.22)).x;
        float Sun = 0.05*(1.0 + SunRay)*pow(Halo, 1000.0)*smoothstep(0.85, 1.3, length(SunC+uv));
    
        // Sphere hit:
        float z = 1.0 - dot(uv, uv);
        if(z < 0.0)
        {
            Sun += 1.5*pow(Halo, 10000.0);
            return Sun*RGB(255,250,230);
        }
        
        // Intersection:
        vec3 Normal     = vec3(uv.x, uv.y, sqrt(z));
        vec3 Reflection = reflect(vec3(0.0, 0.0, 1.0), Normal);

        float angleY = iMouse.x;   // or a uniform vec2 uAngles
        float angleX = iMouse.y;


        vec3 n = rotY(angleY) * rotX(angleX) * Normal;

        float U = 1.0 - atan(n.z, n.x) / (2.0*Pi);
        float V = 1.0 - atan(length(n.xz), n.y) / Pi;

        vec3 Ground = pow(texture2D(iChannel0, vec2(U, V)).xyz, vec3(2.22));
        vec3 Cloud  = vec3(0,0,0);//pow(texture2D(iChannel1, vec2(U, V)).xyz, vec3(2.22));
        vec3 Cloud2 = vec3(0,0,0);//pow(texture2D(iChannel1, vec2(U, V)).xyz, vec3(2.22));
        vec3 KsMap  = pow(texture2D(iChannel1, vec2( 0.0, 0.8)).xyz, vec3(2.22));
        vec3 Night  = pow(texture2D(iChannel2, vec2(U, V)).xyz, vec3(2.22));
        
        // Shading
        float Diffuse     = max(0.0, dot(Normal, LightDir));
        float Specular    = max(0.0, dot(-Reflection, LightDir));
        float Scatter     = 4.0*pow((sqrt(R1 - dot(uv, uv)) - Normal.z) / sqrt(R1-R0), 1.35);
        float Extinct     = pow(1.0 - Diffuse, 4.0);
        float Sea         = smoothstep(1.0, 0.0, 100.0*length(Ground - RGB(2,5,20)));
        float Shadow      = 1.0 - pow(Cloud2.x, 0.2);
        
        vec3 Light = mix(vec3(1.0), RGB(255, 150, 40), Extinct);
    
        Color = Shadow*(Ground + 0.8*Sea*RGB(19,35,60));
        Color = mix(Color, vec3(1.0), 2.0*Cloud);
        Color *= Light*Diffuse;
        Color += 2.0*Light*Diffuse*(0.3 + 0.7*KsMap.x)*mix(0.03, 0.4, Sea)*pow(Specular, (0.8 + 0.2*KsMap.x)*mix(9.0, 200.0, Sea));
        Color += pow(max(0.0, dot(Normal, -LightDir)), 2.0)*Night*(1.0-pow(Cloud.x, 0.2));
        Color *= mix(vec3(1.0), RGB(255-58,255-72,255-90), 1.0*Scatter);
        Color += 4.0*Diffuse*(1.0 + Sea)*Scatter*RGB(58,72,90);

        Color += Sun*RGB(255,250,230);
        
        return Color;
    }

    void main()
    {
        vec2 newFragCoord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);
        vec2 uv = (2.0*newFragCoord - iResolution.xy) / iResolution.y;
        vec3 Color = pow(Render(1.05*uv*Zoom),  vec3(0.45));
        gl_FragColor = vec4(Color, 1.0);
    }

`;

export default fsPlanet;