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
        float t = 1.0*iTime;

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





        


        // Textures:
        // float U = 1.0-atan(Normal.z, Normal.x) / (2.0*Pi);
        // float V = 1.0-(atan(length(Normal.xz), Normal.y)) / Pi;
        vec3 Ground = pow(texture2D(iChannel0, vec2(U, V)).xyz, vec3(2.22));
        vec3 Cloud  = pow(texture2D(iChannel1, vec2(U, V)).xyz, vec3(2.22));
        vec3 Cloud2 = pow(texture2D(iChannel1, vec2(U, V)).xyz, vec3(2.22));
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

// const fsPlanet = `

//     /*--------------------------------------------------------------------------------------
//     License CC0 - http://creativecommons.org/publicdomain/zero/1.0/
//     To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
//     ----------------------------------------------------------------------------------------
//     ^ This means do ANYTHING YOU WANT with this code. Because we are programmers, not lawyers.
//     -Otavio Good
//     */
//     precision mediump float;

//     uniform vec2 iResolution;
//     uniform float iTime;
//     uniform vec2 iMouse;
//     uniform sampler2D iChannel0;
//     uniform sampler2D iChannel1;
//     uniform sampler2D iChannel2;
//     uniform sampler2D iChannel3;

//     varying vec4 fragCoord;

//     float PI=3.14159265;
//     vec3 sunCol = vec3(258.0, 208.0, 100.0) / 15.0;
//     vec3 environmentSphereColor = vec3(0.3001, 0.501, 0.901) * 0.0;

//     float distFromSphere;
//     vec3 normal;
//     vec3 texBlurry;

//     vec3 saturate(vec3 a)
//     {
//         return clamp(a, 0.0, 1.0);
//     }
//     vec2 saturate(vec2 a)
//     {
//         return clamp(a, 0.0, 1.0);
//     }
//     float saturate(float a)
//     {
//         return clamp(a, 0.0, 1.0);
//     }

//     vec3 GetSunColor(vec3 rayDir, vec3 sunDir)
//     {
//         float dense = 16.0;
//         vec3 localRay = normalize(rayDir);
//         float sunIntensity = 1.0 - (dot(localRay, sunDir) * 0.5 + 0.5);
//         //sunIntensity = (float)Math.Pow(sunIntensity, 14.0);
//         sunIntensity = 0.2 / sunIntensity;
//         sunIntensity = min(sunIntensity, 40000.0);
//         sunIntensity = max(0.0, sunIntensity - 3.0);

//         localRay.x = localRay.x + 1.0 - iTime * 0.1;
//         //vec3 right = normalize(cross(sunDir, vec3(0.0,1.0,0.0)));
//         //vec3 up = normalize(cross(sunDir, right));
//         vec2 wrap = fract((localRay.xy)*dense);
//         vec4 rand = texture2D(iChannel2, floor(localRay.xy*dense)/dense).xyzw;
//         vec3 starColor = rand.xyz;
//         starColor = starColor * 0.75 + 0.25;
//         rand.xy = rand.xy * 2.0 - 1.0;
//         vec2 center = vec2(0.5, 0.5) + rand.xy * 0.9;// floor(fract((localRay.xy)*8.0)) + 0.5;
//         float star = length(wrap - center);
//         float test = star;
//         star = saturate((1.0 - star));
//         float blink = texture2D(iChannel2, localRay.xy + iTime * 0.03).x;
//         float cluster = 0.3;// /*(localRay.x+0.5) */ (localRay.y+0.5) * 2.8 + 0.8;
//         star = pow(star, 60.0 + saturate(rand.z - 0.0) * 250.0 * cluster);
//         star *= blink;
        
//         float milkyMask = saturate(0.25 - abs(localRay.x - 0.65));
//         vec3 milkyway = texture2D(iChannel3, (localRay.yx*1.5 )+vec2(0.65, 0.3)).yxz;
//         vec3 milkyLOD = texture2D(iChannel3, (localRay.yx*1.5 )+vec2(0.65, 0.3), 3.0).yxz;
//         vec3 milkyDetail = texture2D(iChannel3, (-localRay.yx*8.0 )+vec2(0.65, 0.3)).yxz;
//         milkyway *= milkyDetail.xxx;
//         milkyway *= vec3(1.0, 0.8, 0.91)*1.5;
//         milkyway = pow(milkyway, vec3(2.0, 2.0, 2.0)*3.0);
//         milkyway += vec3(0.2, 0.0015, 1.001) * milkyLOD * 0.006;
        
//         vec3 finalColor = milkyway /* milkyMask*/ * 10850.0;
//         finalColor += environmentSphereColor + sunCol * sunIntensity + starColor * star * 12000.0 * cluster;
//         return finalColor;
//         //return environmentSphereColor + sunCol * sunIntensity + starColor * star * 12000.0 * cluster;
//         //return vec3(1.0,1.0,1.0)*cluster*1000.0;
//     }
//     vec3 GetSunColorReflection(vec3 rayDir, vec3 sunDir)
//     {
//         vec3 localRay = normalize(rayDir);
//         float sunIntensity = 1.0 - (dot(localRay, sunDir) * 0.5 + 0.5);
//         //sunIntensity = (float)Math.Pow(sunIntensity, 14.0);
//         sunIntensity = 0.2 / sunIntensity;
//         sunIntensity = min(sunIntensity, 40000.0);
//         return environmentSphereColor + sunCol * sunIntensity;
//     }

//     vec3 LensFlare(vec2 uv, vec2 lfPos)
//     {
//         vec2 delta = uv - lfPos;
//         float dist = length(delta);
//         float angle = atan(delta.x, delta.y);
//         vec3 tex = texture2D(iChannel0, vec2(angle*5.0, dist*0.125) /*- iTime*0.1*/).xyz;
//         float bump = sin(angle * 6.0) * 0.5 + 0.54;
//         bump -= pow(dist, 0.0125);
//         bump = saturate(bump);

//         return sunCol * tex.x * 0.1 * bump / (dist);
//     }

//     float IntersectSphereAndRay(vec3 pos, float radius, vec3 posA, vec3 posB, out vec3 intersectA2, out vec3 intersectB2)
//     {
//         // Use dot product along line to find closest point on line
//         vec3 eyeVec2 = normalize(posB-posA);
//         float dp = dot(eyeVec2, pos - posA);
//         vec3 pointOnLine = eyeVec2 * dp + posA;
//         // Clamp that point to line end points if outside
//         //if ((dp - radius) < 0) pointOnLine = posA;
//         //if ((dp + radius) > (posB-posA).Length()) pointOnLine = posB;
//         // Distance formula from that point to sphere center, compare with radius.
//         float distance = length(pointOnLine - pos);
//         float ac = radius*radius - distance*distance;
//         float rightLen = 0.0;
//         if (ac >= 0.0) rightLen = sqrt(ac);
//         intersectA2 = pointOnLine - eyeVec2 * rightLen;
//         intersectB2 = pointOnLine + eyeVec2 * rightLen;
//         distFromSphere = distance - radius;
//         if (distance <= radius) return 1.0;
//         return 0.0;
//     }

//     vec2 Spiral(vec2 uv)
//     {
//         float reps = 2.0;
//         vec2 uv2 = fract(uv*reps);
//         vec2 center = floor(fract(uv*reps)) + 0.5;
//         vec2 delta = uv2 - center;
//         float dist = length(delta);
//         float angle = atan(delta.y, delta.x);
//         //if (distance(center, uv2) < 0.02) return vec2(10,10);
//         float nudge = dist * 4.0;
//         vec2 offset = vec2(delta.y, -delta.x);// * 0.2 / dist ;// vec2(sin(angle+nudge), cos(angle+nudge));
//         float blend = max(abs(delta.x), abs(delta.y))* 2.0;
//         blend = clamp((0.5 - dist) * 2.0, 0.0, 1.0);
//         blend = pow(blend, 1.5);
//         //offset *= clamp(1.0 - blend, 0.0, 1.0);
//         offset *= clamp(blend, 0.0, 1.0);
//         //if (dist > 0.5) offset = vec2(0,0);
//         //offset *= dist;
//         return uv + offset*vec2(1.0,1.0)*1.1*texBlurry.x ;//+ vec2(iTime*0.03, 0.0);
//     }

//     void main()
//     {
//         //vec2 uv = gl_FragCoord.xy / iResolution.yy + vec2(-0.4,0.0);
//         //vec3 worldPix = vec3(uv*2.0 - 1.0, 1.65);// + (iMouse.x - iResolution.x * 0.2)* 0.01);
//         //vec3 camPos = vec3(0.0,0.1,0.0);


//         vec2 uv = gl_FragCoord.xy/iResolution.xy - 0.5;

//         // Camera up vector.
//         vec3 camUp=vec3(0,1,0); // vuv

//         // Camera lookat.
//         vec3 camLookat=vec3(0,0.0,0);	// vrp

//         float mx=-PI/2.0;//iMouse.x/iResolution.x*PI*2.0;
//         float my=0.0;//-iMouse.y/iResolution.y*10.0;//*PI/2.01;
//         vec3 camPos=vec3(cos(my)*cos(mx),sin(my),cos(my)*sin(mx))*(2.5); 	// prp

//         // Camera setup.
//         vec3 camVec=normalize(camLookat - camPos);//vpn
//         vec3 sideNorm=normalize(cross(camUp, camVec));	// u
//         vec3 upNorm=cross(camVec, sideNorm);//v
//         vec3 worldFacing=(camPos + camVec);//vcv
//         vec3 worldPix = worldFacing + uv.x * sideNorm * (iResolution.x/iResolution.y) + uv.y * upNorm;//scrCoord
//         vec3 relVec = normalize(worldPix - camPos);//scp


//         vec3 planetPos = vec3(0.0,0.0,0.0);
//         vec3 iA, iB, iA2, iB2;
//         float t = iTime * 0.1 + 0.7 - iMouse.x*0.01;
//         float cloudT = iTime * 0.1;
//         float distFromSphere2;
//         vec3 normal2;
//         float hit2 = IntersectSphereAndRay(planetPos, 1.05, camPos, worldPix, iA2, iB2);
//         normal2 = normal;
//         distFromSphere2 = distFromSphere;
//         float hit = IntersectSphereAndRay(planetPos, 1.0, camPos, worldPix, iA, iB);
//         //float hit = IntersectSphereAndRay(planetPos, 1.0, camPos, pixPos, iA, iB);
//         normal = normalize(iA - planetPos);
//         //if (abs(normal.x) <= 0.001) normal.x += 0.001;
//         vec2 polar = vec2(atan(normal.x, normal.z)/*0.955*/, acos(normal.y));
//         polar.x = (polar.x + PI) / (PI * 2.0);
//         polar.y = polar.y / PI;// + 0.5;
//         if (abs(normal.x) <= 0.02)
//         {
//             //polar.x = 0.0;
//         }
//         polar.x = (polar.x+2.03);
//         polar.xy = iA.xy;
//         //polar.y = floor(polar.y * 32.0) / 32.0;
//     /*	if (abs(normal.x) < abs(normal.z))
//         {
//             polar = vec2((atan(normal.z, normal.x))*0.955, acos(iA.y));
//             //polar.x = 0.0;
//         }*/
//         //+ vec2(0.0,iTime * 0.01)
//         vec4 texNoise = texture2D(iChannel2, (polar.xy+vec2(t,0)) * 2.0);
//         texNoise.y = texture2D(iChannel2, (polar.xy+vec2(t,0)) * 1.0).y;
//         texNoise.z = texture2D(iChannel2, (polar.xy+vec2(t,0)) * 4.0).z;
//         texBlurry = texture2D(iChannel0, (polar.xy+vec2(t,0))*0.03125*0.25 ).rgb;

//         vec3 tex = texture2D(iChannel0, (polar.xy+vec2(t,0))*1.0).rgb;
//         //vec3 tex = texture2D(iChannel0, polar.xy, 0.0).rgb;
//         tex *= tex;
//         vec3 texFlip = texture2D(iChannel0, (1.0 - (polar.xy+vec2(t,0))*0.5)).rgb;
//         texFlip *= texFlip;

//         vec3 texS = texture2D(iChannel0, (Spiral(polar.xy+vec2(t,0))+vec2(cloudT*0.25,0))*1.0).rgb;
//         texS *= texS;
//         vec3 texFlipS = texture2D(iChannel0, (1.0 - (Spiral(polar.xy+vec2(t,0))+vec2(cloudT*0.25,0))*0.5)).rgb;
//         texFlipS *= texFlipS;

//         float atmosphereDensity = (1.45 + normal.z);
//         vec3 atmosphereColor = vec3(0.075, 0.35, 0.99) * 0.45;
//         float cloudDensity = max(0.0, (pow(texFlipS.x * texS.x, 0.7) * 3.0));
//         vec3 finalAtmosphere = atmosphereColor * atmosphereDensity + cloudDensity;
//         vec3 finalColor = finalAtmosphere;

//         vec3 detailMap = min(texture2D(iChannel3, (polar.xy+vec2(t,0)) * 2.0).xyz, 0.25) * 4.0;
//         float land = pow(max(0.0, texture2D(iChannel1, (polar.xy+vec2(t,0))* 0.25).z - 0.25), 0.4)*0.75;
//         float land2 = land * texBlurry.x * 6.0;
//         land *= detailMap.x;
//         //land2 *= detailMap.x;
//         land2 = max(0.0, land2);
//         land -= tex.x*0.65;
//         land = max(0.0, land);
//         float iceFactor = abs(pow(normal.y,2.0));
//         vec3 landColor = max(vec3(0.0,0.0,0.0), vec3(0.13,0.65,0.01) * land);// * (1.0 + iceFactor*2.0);
//         vec3 landColor2 = max(vec3(0.0,0.0,0.0), vec3(0.8,0.4,0.01) * land2);
//         vec3 mixedLand = (landColor + landColor2)* 0.5;
//         mixedLand *= (detailMap.zyx + 2.0) * 0.333;
//         //float hardBlur = saturate((texBlurry.x - 0.2)* 104.0 + 0.2)* 0.2 + 0.4;
//         //vec3 finalLand = mix(landColor, landColor2, hardBlur);
//         vec3 finalLand = mix(mixedLand, vec3(7.0, 7.0, 7.0) * land, iceFactor);
//         finalLand = mix(atmosphereColor * 0.05, finalLand, pow(min(1.0,max(0.0,-distFromSphere*1.0)), 0.2));
//         finalColor += finalLand;
//         finalColor *= hit;

//         float refNoise = (texNoise.x + texNoise.y + texNoise.z)* 0.3333;
//         vec3 noiseNormal = normal;
//         noiseNormal.x += refNoise*0.05*hit;
//         noiseNormal.y += tex.x*hit*0.1;
//         noiseNormal.z += texFlip.x*hit*0.1;
//         noiseNormal = normalize(noiseNormal);
//         vec3 ref = reflect(normalize(worldPix - camPos), noiseNormal);

//         refNoise = refNoise*0.25 + 0.75;
//         float orbitSpeed = 0.125;
//         //vec3 sunDir = normalize(vec3(-0.9 + sin(iTime*0.2)*0.5, -0.1, -0.9150));
//         vec3 sunDir = normalize(vec3(-0.009 + sin(iTime*orbitSpeed), -0.13, -cos(iTime*orbitSpeed)));
//         vec3 r = normalize(cross(sunDir, vec3(0.0,1.0,0.0)));
//         vec3 up = normalize(cross(sunDir, r));
//         float binarySpeed = 0.5;
//         float binaryDist = 0.3;
//         sunDir += r * sin(iTime*binarySpeed) * binaryDist + up * cos(iTime*binarySpeed) * binaryDist;
//         sunDir = normalize(sunDir);

//         vec3 sunDir2 = normalize(vec3(-0.009 + sin((iTime+0.2)*orbitSpeed), 0.13, -cos((iTime+0.2)*orbitSpeed)));
//         r = normalize(cross(sunDir2, vec3(0.0,1.0,0.0)));
//         up = normalize(cross(sunDir2, r));
//         sunDir2 -= r * sin(iTime*binarySpeed) * binaryDist + up * cos(iTime*binarySpeed) * binaryDist;
//         sunDir2 = normalize(sunDir2);

//         vec3 refNorm = normalize(ref);
//         float glance = saturate(dot(refNorm, sunDir) * saturate(sunDir.z - 0.65));
//         float glance2 = saturate(dot(refNorm, sunDir2) * saturate(sunDir2.z - 0.65));
//         float landMask = finalLand.x + finalLand.y * 1.5;
//         vec3 sunRef = GetSunColorReflection(refNorm, sunDir)*0.005*hit * (1.0 - saturate(landMask*3.5)) * (1.0-texS.x) * refNoise;
//         vec3 sunRef2 = GetSunColorReflection(refNorm, sunDir2)*0.005*hit * (1.0 - saturate(landMask*3.5)) * (1.0-texS.x) * refNoise;
        
//         //sunRef = mix(sunRef, atmosphereColor * vec3(1.0, 0.2, 0.1)*3.0, saturate(atmosphereDensity - 0.35)) * hit;
//         //sunRef *= atmosphereColor;
//         // fade to sunset color at outer atmosphere
//         sunRef = mix(sunRef, vec3(3.75, 0.8, 0.02)* hit, glance);
//         sunRef2 = mix(sunRef2, vec3(3.75, 0.8, 0.02)* hit, glance2);
//         finalColor += sunRef;
//         finalColor += sunRef2;

//         vec3 sunsColor = GetSunColor(normalize(ref), sunDir) *0.000096*(1.0-hit) +
//                         GetSunColor(normalize(ref), sunDir2)*0.000096*(1.0-hit);

//         float outerGlow = 1.0 - clamp(distFromSphere * 20.0, 0.0, 1.0);
//         outerGlow = pow(outerGlow, 5.2);
//         finalColor += (atmosphereColor + vec3(0.2, 0.2, 0.2)) * outerGlow * (1.0 - hit);
        
//         float light = saturate(dot(sunDir, noiseNormal));
//         light += saturate(dot(sunDir2, noiseNormal));
//         finalColor *= light * 0.75 + 0.001;	// ambient light (from stars, of course)
//         finalColor += sunsColor;

//         float scattering, scattering2;
//         if (hit2 == 1.0) scattering = distance(iA2, iB2);
//         scattering2 = scattering;
//         scattering *= pow(saturate(dot(relVec, sunDir) - 0.96), 2.0);
//         scattering2 *= pow(saturate(dot(relVec, sunDir2) - 0.96), 2.0);
//         scattering *= hit2 * (1.0 - hit);
//         scattering2 *= hit2 * (1.0 - hit);
//         scattering *= outerGlow;
//         scattering2 *= outerGlow;
//         finalColor += vec3(1.0, 0.25, 0.05) * scattering * 3060.0;
//         finalColor += vec3(1.0, 0.25, 0.05) * scattering2 * 3060.0;

//         //vec3 sunUV = worldFacing + sunDir2.x * sideNorm * (iResolution.x/iResolution.y) + sunDir2.y * upNorm;
//         //float lame = distance(sunUV, worldPix);
//         //vec3 sunUV = sunDir2 / vec3(sideNorm  * (iResolution.x/iResolution.y) * 0.4 + upNorm * 0.999);
//         //finalColor += LensFlare(uv * vec2((iResolution.x/iResolution.y), 1.0), vec2(sunUV.x, sunUV.y));

//         //finalColor = vec3(1.0,1.0,1.0) * (finalLand.x + finalLand.y)*hit;
//         //finalColor += vec3(1.0,1.0,1.0) * glance;
//         //finalColor = vec3(0, polar.x, 0.0);
//         //finalColor = GetSunColorReflection(normalize(ref), sunDir)*0.005*hit * (1.0 - clamp(finalLand.x*12.0, 0.0, 1.0)) * (1.0-texS.x) * refNoise;
//         //if (abs(normal.x) <= 0.001) finalColor = vec3(1.0,0.0,0.0);

//         gl_FragColor = vec4(sqrt(finalColor),1.0);
//     }


// `;

export default fsPlanet;