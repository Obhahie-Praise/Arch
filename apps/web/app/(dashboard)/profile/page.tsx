import { ChevronDown } from "lucide-react";
import React from "react";

const ProfilePage = () => {
  return (
    <div className="">
      <div className="">
        <p className=" font-medium text-lg pb-3">Identity</p>
        <div className="px-4 space-y-2">
          {/* PRE-DERTERMINED BY THE NAME ON THE SIGN IN ACCOUNT BUT CHANGABLE, BUT DOES NOT AFFECT THE ACCOUNT NAME */}
          <div className="flex flex-col gap-0.5">
            <label htmlFor="fullname" className="text-sm ">
              Full name
            </label>
            <input
              type="text"
              name="fullname"
              id="fullname"
              placeholder="Enter your Full name"
              className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/60 transition-all duration-300"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label htmlFor="fullname" className="text-sm ">
              Preferred name
            </label>
            <input
              type="text"
              name="prefferedname"
              id="prefferedname"
              placeholder="Enter your Preffered name"
              className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/60 transition-all duration-300"
            />
          </div>
          {/* THE INPUT SHOULD HAVE A PREFIXED @ IN THE INPUT AND SHOULD NOT BE REMOVABLE */}
          <div className="flex flex-col gap-0.5">
            <label htmlFor="username" className="text-sm ">
              Username
            </label>
            <input
              type="text"
              name="username"
              id="username"
              placeholder="@your_user_name"
              className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/60 transition-all duration-300"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label htmlFor="location" className="text-sm ">
              Location
            </label>
            <div className="flex items-center w-full gap-2">
              <div className="flex items-center justify-between px-6 py-3 border-2 border-border rounded-full w-full cursor-pointer transition-all duration-300 hover:border-foreground/30">
                <p className="text-sm ">Country</p>
                <ChevronDown size={16} strokeWidth={1.5} />
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-2 border-border rounded-full w-full cursor-pointer transition-all duration-300 hover:border-foreground/30">
                <p className="text-sm ">State</p>
                <ChevronDown size={16} strokeWidth={1.5} />
              </div>
              <div className="flex items-center justify-between px-6 py-3 border-2 border-border rounded-full w-full cursor-pointer transition-all duration-300 hover:border-foreground/30">
                <p className="text-sm ">City</p>
                <ChevronDown size={16} strokeWidth={1.5} />
              </div>
            </div>
          </div>
          {/* THE EMAIL ON THE PROFILE IS READ ONLY. THE USER CANNOT EDIT IT. if the user tries to edit it, have a small message under the input with a duration telling them it is read only*/}
          <div className="flex flex-col gap-0.5">
            <label htmlFor="email" className="text-sm ">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="obhahiepraise@gmail.com"
              className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/60 transition-all duration-300"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label htmlFor="email" className="text-sm ">
              Github
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="obhahiepraise@gmail.com"
              className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/60 transition-all duration-300"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label htmlFor="email" className="text-sm ">
              LinkedIn
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="obhahiepraise@gmail.com"
              className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/60 transition-all duration-300"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label htmlFor="email" className="text-sm ">
              Twitter
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="obhahiepraise@gmail.com"
              className="border-2 border-border text-base rounded-full px-6 py-3 w-full focus:outline-none focus:border-foreground/60 focus:ring-1 focus:ring-foreground/60 transition-all duration-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
